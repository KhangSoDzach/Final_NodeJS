/**
 * Guest Cart Middleware
 * Xử lý giỏ hàng cho khách không đăng nhập
 */

const Cart = require('../models/cart');
const Product = require('../models/product');

/**
 * Middleware khởi tạo guest cart trong session
 */
const initGuestCart = (req, res, next) => {
  // Nếu user đã đăng nhập, không cần guest cart
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Khởi tạo guest cart trong session nếu chưa có
  if (!req.session.guestCart) {
    req.session.guestCart = {
      items: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  // Attach guest cart methods
  req.guestCart = {
    items: req.session.guestCart.items,
    
    /**
     * Thêm sản phẩm vào guest cart
     */
    async addItem(productId, quantity = 1, variant = null) {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Sản phẩm không tồn tại');
      }

      // Kiểm tra tồn kho
      let availableStock = product.stock;
      let variantInfo = null;

      if (variant && product.variants && product.variants.length > 0) {
        const productVariant = product.variants.find(v => 
          v.name === variant.name && v.value === variant.value
        );
        if (productVariant) {
          availableStock = productVariant.stock;
          variantInfo = {
            name: productVariant.name,
            value: productVariant.value,
            priceAdjustment: productVariant.priceAdjustment || 0
          };
        }
      }

      // Tìm item đã có trong cart
      const existingIndex = req.session.guestCart.items.findIndex(item => {
        if (item.product.toString() !== productId.toString()) return false;
        if (variantInfo && item.variant) {
          return item.variant.name === variantInfo.name && 
                 item.variant.value === variantInfo.value;
        }
        return !variantInfo && !item.variant;
      });

      if (existingIndex > -1) {
        // Cập nhật số lượng
        const newQuantity = req.session.guestCart.items[existingIndex].quantity + quantity;
        if (newQuantity > availableStock) {
          throw new Error(`Chỉ còn ${availableStock} sản phẩm trong kho`);
        }
        req.session.guestCart.items[existingIndex].quantity = newQuantity;
      } else {
        // Thêm mới
        if (quantity > availableStock) {
          throw new Error(`Chỉ còn ${availableStock} sản phẩm trong kho`);
        }
        
        const price = product.discountPrice || product.price;
        const finalPrice = variantInfo ? price + variantInfo.priceAdjustment : price;

        req.session.guestCart.items.push({
          product: productId,
          productName: product.name,
          productImage: product.images && product.images.length > 0 ? product.images[0] : null,
          price: finalPrice,
          originalPrice: product.price,
          quantity,
          variant: variantInfo
        });
      }

      req.session.guestCart.lastUpdated = new Date();
      return req.session.guestCart;
    },

    /**
     * Cập nhật số lượng item
     */
    async updateItem(itemIndex, quantity) {
      if (itemIndex < 0 || itemIndex >= req.session.guestCart.items.length) {
        throw new Error('Item không tồn tại');
      }

      const item = req.session.guestCart.items[itemIndex];
      const product = await Product.findById(item.product);
      
      if (!product) {
        // Xóa item nếu product không còn tồn tại
        req.session.guestCart.items.splice(itemIndex, 1);
        throw new Error('Sản phẩm không còn tồn tại');
      }

      // Kiểm tra stock
      let availableStock = product.stock;
      if (item.variant && product.variants) {
        const variant = product.variants.find(v => 
          v.name === item.variant.name && v.value === item.variant.value
        );
        if (variant) {
          availableStock = variant.stock;
        }
      }

      if (quantity > availableStock) {
        throw new Error(`Chỉ còn ${availableStock} sản phẩm trong kho`);
      }

      if (quantity <= 0) {
        req.session.guestCart.items.splice(itemIndex, 1);
      } else {
        req.session.guestCart.items[itemIndex].quantity = quantity;
      }

      req.session.guestCart.lastUpdated = new Date();
      return req.session.guestCart;
    },

    /**
     * Xóa item khỏi cart
     */
    removeItem(itemIndex) {
      if (itemIndex < 0 || itemIndex >= req.session.guestCart.items.length) {
        throw new Error('Item không tồn tại');
      }
      req.session.guestCart.items.splice(itemIndex, 1);
      req.session.guestCart.lastUpdated = new Date();
      return req.session.guestCart;
    },

    /**
     * Xóa toàn bộ cart
     */
    clear() {
      req.session.guestCart.items = [];
      req.session.guestCart.lastUpdated = new Date();
      return req.session.guestCart;
    },

    /**
     * Tính tổng tiền
     */
    getTotal() {
      return req.session.guestCart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },

    /**
     * Lấy số lượng items
     */
    getItemCount() {
      return req.session.guestCart.items.reduce((count, item) => {
        return count + item.quantity;
      }, 0);
    },

    /**
     * Validate cart items (kiểm tra stock và price hiện tại)
     */
    async validate() {
      const errors = [];
      const validItems = [];

      for (let i = 0; i < req.session.guestCart.items.length; i++) {
        const item = req.session.guestCart.items[i];
        const product = await Product.findById(item.product);

        if (!product) {
          errors.push({
            index: i,
            message: `Sản phẩm "${item.productName}" không còn tồn tại`
          });
          continue;
        }

        if (!product.isActive) {
          errors.push({
            index: i,
            message: `Sản phẩm "${item.productName}" đã ngừng kinh doanh`
          });
          continue;
        }

        let availableStock = product.stock;
        if (item.variant && product.variants) {
          const variant = product.variants.find(v => 
            v.name === item.variant.name && v.value === item.variant.value
          );
          if (variant) {
            availableStock = variant.stock;
          }
        }

        if (item.quantity > availableStock) {
          if (availableStock === 0) {
            errors.push({
              index: i,
              message: `Sản phẩm "${item.productName}" đã hết hàng`
            });
          } else {
            errors.push({
              index: i,
              message: `Sản phẩm "${item.productName}" chỉ còn ${availableStock} sản phẩm`,
              maxQuantity: availableStock
            });
          }
          continue;
        }

        // Cập nhật giá mới nhất
        const currentPrice = product.discountPrice || product.price;
        const finalPrice = item.variant ? currentPrice + (item.variant.priceAdjustment || 0) : currentPrice;
        
        if (item.price !== finalPrice) {
          item.price = finalPrice;
          item.priceChanged = true;
        }

        validItems.push(item);
      }

      return { errors, validItems };
    }
  };

  next();
};

/**
 * Merge guest cart vào user cart khi đăng nhập
 */
const mergeGuestCart = async (req, res, next) => {
  try {
    // Chỉ merge khi user vừa đăng nhập và có guest cart
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return next();
    }

    if (!req.session.guestCart || req.session.guestCart.items.length === 0) {
      return next();
    }

    // Tìm hoặc tạo user cart
    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = new Cart({ user: req.user._id, items: [] });
    }

    // Merge items
    for (const guestItem of req.session.guestCart.items) {
      const existingIndex = userCart.items.findIndex(item => {
        if (item.product.toString() !== guestItem.product.toString()) return false;
        if (guestItem.variant && item.variant) {
          return item.variant.name === guestItem.variant.name && 
                 item.variant.value === guestItem.variant.value;
        }
        return !guestItem.variant && !item.variant;
      });

      if (existingIndex > -1) {
        // Cộng dồn số lượng
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        // Thêm mới
        userCart.items.push({
          product: guestItem.product,
          quantity: guestItem.quantity,
          variant: guestItem.variant,
          addedAt: new Date()
        });
      }
    }

    await userCart.save();

    // Xóa guest cart sau khi merge
    delete req.session.guestCart;

    next();
  } catch (error) {
    console.error('Error merging guest cart:', error);
    next(); // Tiếp tục dù có lỗi
  }
};

/**
 * Middleware lấy cart count cho header (cả guest và user)
 */
const getCartCount = async (req, res, next) => {
  try {
    let cartCount = 0;

    if (req.isAuthenticated && req.isAuthenticated()) {
      // User đã đăng nhập
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);
      }
    } else if (req.session.guestCart) {
      // Guest cart
      cartCount = req.session.guestCart.items.reduce((count, item) => count + item.quantity, 0);
    }

    res.locals.cartCount = cartCount;
    next();
  } catch (error) {
    res.locals.cartCount = 0;
    next();
  }
};

module.exports = {
  initGuestCart,
  mergeGuestCart,
  getCartCount
};
