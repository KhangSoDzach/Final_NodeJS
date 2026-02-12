/**
 * Wishlist Routes
 * Routes cho danh sách yêu thích
 */

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');
const { isAuth } = require('../middleware/auth');

// Tất cả routes yêu cầu đăng nhập
router.use(isAuth);

// Xem danh sách yêu thích
router.get('/', wishlistController.getWishlist);

// Lấy số lượng items (cho header)
router.get('/count', wishlistController.getWishlistCount);

// Thêm sản phẩm vào wishlist
router.post('/add', wishlistController.addToWishlist);

// Kiểm tra sản phẩm có trong wishlist không
router.get('/check/:productId', wishlistController.checkWishlist);

// Xóa sản phẩm khỏi wishlist
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

// Xóa tất cả sản phẩm
router.post('/clear', wishlistController.clearWishlist);

// Chuyển sản phẩm sang giỏ hàng
router.post('/move-to-cart/:productId', wishlistController.moveToCart);

module.exports = router;
