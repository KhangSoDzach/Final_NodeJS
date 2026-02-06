const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const { v4: uuidv4 } = require('uuid');

// Get cart page
exports.getCart = async (req, res) => {
  try {
    // Find cart based on user or session ID
    let cart;
    let isGuest = false;

    if (req.user && req.isAuthenticated && req.isAuthenticated()) {
      const allCarts = await Cart.find({});
      console.log('GetCart Debug: All Carts in DB:', JSON.stringify(allCarts));
      console.log('Looking for user:', req.user._id);
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session && req.session.guestCart && req.session.guestCart.items) {


      // Guest cart from session
      isGuest = true;
      // Populate product info for guest cart items
      const populatedItems = [];
      for (const item of req.session.guestCart.items) {
        if (!item.product) continue;
        const product = await Product.findById(item.product);
        if (product) {
          populatedItems.push({
            ...item,
            product: product
          });
        }
      }
      cart = {
        items: populatedItems,
        calculateTotal: () => populatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        coupon: null
      };
    } else if (req.session && req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }


    res.render('cart/cart', {
      title: 'Giỏ hàng',
      cart,
      isGuest
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải giỏ hàng.');
    res.redirect('/');
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, variants, buyNow } = req.body;

    // Validate quantity
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ.'
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.'
      });
    }

    // Check if product is in stock
    let isInStock = true;
    let price = product.discountPrice || product.price;

    // BUG-005 FIX: Kiểm tra tồn kho cho cả variant và tổng stock product
    if (variants && typeof variants === 'object' && Object.keys(variants).length > 0) {
      // Kiểm tra từng variant
      for (const [variantName, variantValue] of Object.entries(variants)) {
        const productVariant = product.variants.find(v => v.name === variantName);
        if (productVariant) {
          const variantOption = productVariant.options.find(o => o.value === variantValue);
          if (variantOption) {
            if (variantOption.stock < qty) isInStock = false;
            price += variantOption.additionalPrice || 0;
          }
        }
      }
      // Cũng kiểm tra tổng stock product để đảm bảo đồng nhất
      if (product.stock < qty) isInStock = false;
    } else {
      // Không có variant, chỉ kiểm tra stock product chính
      isInStock = product.stock >= qty;
    }

    if (!isInStock) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không đủ hàng.'
      });
    }

    // Find or create cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId });
    }

    if (!cart) {
      cart = new Cart({
        user: req.user ? req.user._id : null,
        sessionId: req.user ? null : (req.session.cartId || uuidv4()),
        items: []
      });

      if (!req.user) {
        req.session.cartId = cart.sessionId;
      }
    }

    // Check if product is already in cart
    const itemIndex = cart.items.findIndex(item => {
      if (item.product.toString() !== productId) return false;

      if (variants && item.variants) {
        return Object.entries(variants).every(([variantName, variantValue]) => {
          return item.variants[variantName] === variantValue;
        });
      }

      return !item.variants;
    });

    if (itemIndex > -1) {
      // Update quantity if product already in cart
      cart.items[itemIndex].quantity += qty;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: qty,
        price,
        variants: variants || null
      });
    }

    await cart.save();

    if (buyNow) {
      return res.status(200).json({
        success: true,
        message: 'Sản phẩm đã được thêm vào giỏ hàng.',
        redirect: '/orders/checkout'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sản phẩm đã được thêm vào giỏ hàng.',
      cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.'
    });
  }
};

// Update cart item quantity
exports.updateCart = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    console.log('UpdateCart Req Body:', req.body);


    // Validate quantity
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ.'
      });
    }

    // Find cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId });
    }

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng.'
      });
    }

    // Find cart item
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    console.log('UpdateCart Debug:', { itemIdReceived: itemId, itemsInCart: cart.items.map(i => i._id.toString()), matchIndex: itemIndex });
    if (itemIndex === -1) {

      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng.'
      });
    }

    // BUG-007 FIX: Kiểm tra stock trước khi update quantity
    const cartItem = cart.items[itemIndex];
    const product = await Product.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.'
      });
    }

    // Kiểm tra tồn kho
    let availableStock = product.stock;
    if (cartItem.variants && Object.keys(cartItem.variants).length > 0) {
      for (const [variantName, variantValue] of Object.entries(cartItem.variants)) {
        const productVariant = product.variants.find(v => v.name === variantName);
        if (productVariant) {
          const variantOption = productVariant.options.find(o => o.value === variantValue);
          if (variantOption && variantOption.stock < qty) {
            return res.status(400).json({
              success: false,
              message: `Số lượng vượt quá tồn kho. Chỉ còn ${variantOption.stock} sản phẩm.`
            });
          }
        }
      }
    } else if (qty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Số lượng vượt quá tồn kho. Chỉ còn ${availableStock} sản phẩm.`
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = qty;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Giỏ hàng đã được cập nhật.',
      cartTotal: cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal()
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật giỏ hàng.'
    });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId });
    }

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng.'
      });
    }

    // Remove item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Sản phẩm đã được xóa khỏi giỏ hàng.',
      cartTotal: cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal(),
      cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng.'
    });
  }
};

// Apply coupon code - cải thiện với nhiều kiểm tra hơn
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode || couponCode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã giảm giá.'
      });
    }
    // Tìm coupon trong database
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      active: true
    });

    // Kiểm tra coupon có tồn tại không
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không hợp lệ.'
      });
    }

    // Kiểm tra số lượt sử dụng
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng.'
      });
    }

    // BUG-004 FIX: Kiểm tra thời hạn coupon (startDate và endDate)
    const now = new Date();
    const isExpired = coupon.endDate && now > coupon.endDate;
    const isNotStarted = coupon.startDate && now < coupon.startDate;

    console.log('ApplyCoupon Debug:', { couponStart: coupon.startDate, couponEnd: coupon.endDate, now, isExpired, isNotStarted });

    if (isNotStarted) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá chưa có hiệu lực.'
      });
    }
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết hạn.'
      });
    }



    // Tìm giỏ hàng
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng hoặc giỏ hàng trống.'
      });
    }

    // Tính tổng giỏ hàng
    const cartTotal = cart.calculateTotal();

    // Kiểm tra giá trị tối thiểu
    if (coupon.minAmount > 0 && cartTotal < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải có giá trị tối thiểu ${coupon.minAmount.toLocaleString('vi-VN')} ₫ để áp dụng mã giảm giá này.`
      });
    }

    // Áp dụng coupon vào giỏ hàng
    cart.coupon = {
      code: coupon.code,
      discount: Number(coupon.discount)  // Đảm bảo discount là số
    };

    // Lưu giỏ hàng và tăng số lần sử dụng của coupon
    await cart.save();
    console.log('Saved coupon to cart:', JSON.stringify(cart.coupon));

    // Tính toán tổng mới với giảm giá
    const newTotal = cart.calculateTotalWithDiscount();
    const discountAmount = cartTotal - newTotal;

    return res.status(200).json({
      success: true,
      message: 'Mã giảm giá đã được áp dụng.',
      discount: coupon.discount,
      discountAmount: discountAmount,
      originalTotal: cartTotal,
      newTotal: newTotal
    });
  } catch (err) {
    console.error('Error applying coupon:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi áp dụng mã giảm giá.'
    });
  }
};

// Remove coupon
exports.removeCoupon = async (req, res) => {
  try {
    // Find cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId });
    }

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng.'
      });
    }

    // Remove coupon
    cart.coupon = null;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Mã giảm giá đã được xóa.',
      newTotal: cart.calculateTotal()
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa mã giảm giá.'
    });
  }
};
