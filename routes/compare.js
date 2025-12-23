/**
 * Compare Routes
 * Routes cho so sánh sản phẩm
 */

const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compare');

// Xem trang so sánh
router.get('/', compareController.getComparePage);

// Lấy danh sách so sánh (AJAX)
router.get('/list', compareController.getCompareList);

// Kiểm tra sản phẩm có trong danh sách so sánh không
router.get('/check/:productId', compareController.checkInCompare);

// Thêm sản phẩm vào danh sách so sánh
router.post('/add', compareController.addToCompare);

// Xóa sản phẩm khỏi danh sách so sánh
router.delete('/remove/:productId', compareController.removeFromCompare);

// Xóa tất cả
router.post('/clear', compareController.clearCompare);

module.exports = router;
