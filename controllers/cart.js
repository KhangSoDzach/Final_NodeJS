const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const { v4: uuidv4 } = require('uuid');

// Get cart page
exports.getCart = async (req, res) => {
  try {
    // Find cart based on user or session ID
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }
    
    res.render('cart/cart', {
      title: 'Giỏ hàng',
      cart
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
    const { productId, quantity, variant, buyNow } = req.body;
    
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
    
    if (variant) {
      // Check variant stock if specified
      const productVariant = product.variants.find(v => v.name === variant.name);
      if (productVariant) {
        const variantOption = productVariant.options.find(o => o.value === variant.value);
        if (variantOption) {
          isInStock = variantOption.stock >= qty;
          price += variantOption.additionalPrice || 0;
        }
      }
    } else {
      // Check general product stock
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
      
      if (variant && item.variant) {
        return item.variant.name === variant.name && item.variant.value === variant.value;
      }
      
      return !item.variant;
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
        variant: variant || null
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
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng.'
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

// Apply coupon code
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Coupon không hợp lệ hoặc đã hết hạn.' });
    }

    // Check minimum amount
    const cartTotal = req.session.cartTotal || 0;
    if (cartTotal < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải có giá trị tối thiểu ${coupon.minAmount.toLocaleString('vi-VN')} ₫ để áp dụng coupon này.`
      });
    }

    req.session.coupon = coupon;
    res.status(200).json({ success: true, message: 'Coupon đã được áp dụng thành công.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi áp dụng coupon.' });
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
