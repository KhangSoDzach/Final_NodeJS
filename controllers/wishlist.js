/**
 * Wishlist Controller
 * Xử lý các thao tác với danh sách yêu thích
 */

const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

/**
 * Lấy danh sách wishlist của user
 */
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOrCreate(req.user._id);
    await wishlist.populate({
      path: 'items.product',
      select: 'name slug price discountPrice images stock category brand'
    });
    
    // Lọc bỏ các sản phẩm đã bị xóa
    const validItems = wishlist.items.filter(item => item.product);
    
    // Kiểm tra giá giảm
    const itemsWithPriceInfo = validItems.map(item => {
      const currentPrice = item.product.discountPrice || item.product.price;
      const priceDrop = item.priceWhenAdded - currentPrice;
      const priceDropPercent = item.priceWhenAdded > 0 
        ? Math.round((priceDrop / item.priceWhenAdded) * 100) 
        : 0;
      
      return {
        ...item.toObject(),
        currentPrice,
        priceDrop: priceDrop > 0 ? priceDrop : 0,
        priceDropPercent: priceDropPercent > 0 ? priceDropPercent : 0,
        priceIncreased: priceDrop < 0
      };
    });
    
    res.render('user/wishlist', {
      title: 'Danh sách yêu thích',
      items: itemsWithPriceInfo,
      itemCount: validItems.length
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách yêu thích');
    res.redirect('/');
  }
};

/**
 * Thêm sản phẩm vào wishlist (AJAX)
 */
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin sản phẩm' 
      });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    const wishlist = await Wishlist.findOrCreate(req.user._id);
    const currentPrice = product.discountPrice || product.price;
    const result = await wishlist.addProduct(productId, currentPrice);
    
    return res.json({
      ...result,
      itemCount: wishlist.items.length
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra' 
    });
  }
};

/**
 * Xóa sản phẩm khỏi wishlist (AJAX)
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy danh sách yêu thích' 
      });
    }
    
    const result = await wishlist.removeProduct(productId);
    
    return res.json({
      ...result,
      itemCount: wishlist.items.length
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra' 
    });
  }
};

/**
 * Kiểm tra sản phẩm có trong wishlist không (AJAX)
 */
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const inWishlist = wishlist ? wishlist.hasProduct(productId) : false;
    
    return res.json({ inWishlist });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra' 
    });
  }
};

/**
 * Xóa tất cả sản phẩm khỏi wishlist
 */
exports.clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );
    
    req.flash('success', 'Đã xóa tất cả sản phẩm khỏi danh sách yêu thích');
    res.redirect('/user/wishlist');
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/user/wishlist');
  }
};

/**
 * Chuyển sản phẩm từ wishlist sang cart
 */
exports.moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const Cart = require('../models/cart');
    
    // Lấy sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    // Kiểm tra tồn kho
    if (product.stock <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sản phẩm đã hết hàng' 
      });
    }
    
    // Thêm vào cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    
    // Kiểm tra sản phẩm đã có trong cart chưa
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        product: productId,
        quantity: 1,
        price: product.discountPrice || product.price
      });
    }
    
    await cart.save();
    
    // Xóa khỏi wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      await wishlist.removeProduct(productId);
    }
    
    return res.json({ 
      success: true, 
      message: 'Đã chuyển sản phẩm vào giỏ hàng' 
    });
  } catch (error) {
    console.error('Error moving to cart:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra' 
    });
  }
};

/**
 * Lấy số lượng items trong wishlist (cho header)
 */
exports.getWishlistCount = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const count = wishlist ? wishlist.items.length : 0;
    
    return res.json({ count });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    return res.status(500).json({ count: 0 });
  }
};
