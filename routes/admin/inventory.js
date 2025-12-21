const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/admin/inventoryController');
const { body } = require('express-validator');

/**
 * Inventory Routes - Quản lý kho hàng
 * Tất cả routes đều yêu cầu admin authentication (đã được handle ở app.js)
 */

// ========================= MAIN VIEWS =========================

// Trang tổng quan kho hàng
router.get('/', inventoryController.getInventory);

// Lịch sử nhập/xuất kho
router.get('/movements', inventoryController.getStockMovements);

// Cảnh báo tồn kho thấp
router.get('/alerts', inventoryController.getLowStockAlerts);

// Báo cáo kho hàng
router.get('/report', inventoryController.getInventoryReport);

// ========================= STOCK IMPORT/EXPORT =========================

// Nhập kho
router.get('/import', inventoryController.getImportStock);
router.post('/import', [
  body('productId').notEmpty().withMessage('Vui lòng chọn sản phẩm'),
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  body('reason').notEmpty().withMessage('Vui lòng nhập lý do')
], inventoryController.postImportStock);

// Xuất kho
router.get('/export', inventoryController.getExportStock);
router.post('/export', [
  body('productId').notEmpty().withMessage('Vui lòng chọn sản phẩm'),
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  body('reason').notEmpty().withMessage('Vui lòng nhập lý do')
], inventoryController.postExportStock);

// Điều chỉnh tồn kho
router.get('/adjust/:productId', inventoryController.getAdjustStock);
router.post('/adjust/:productId', [
  body('newQuantity').isInt({ min: 0 }).withMessage('Số lượng không hợp lệ'),
  body('reason').notEmpty().withMessage('Vui lòng nhập lý do điều chỉnh')
], inventoryController.postAdjustStock);

// Cập nhật ngưỡng cảnh báo
router.post('/threshold/:productId', inventoryController.postUpdateThreshold);

// ========================= PRE-ORDERS =========================

// Quản lý pre-orders
router.get('/pre-orders', inventoryController.getPreOrders);

// Gửi thông báo cho pre-order
router.post('/pre-orders/:id/notify', inventoryController.postNotifyPreOrder);

// Hủy pre-order
router.post('/pre-orders/:id/cancel', inventoryController.postCancelPreOrder);

// Bật/tắt cho phép đặt trước sản phẩm
router.post('/products/:id/allow-preorder', inventoryController.postTogglePreOrder);

// ========================= BACK IN STOCK NOTIFICATIONS =========================

// Quản lý thông báo có hàng
router.get('/notifications', inventoryController.getBackInStockNotifications);

// Gửi thông báo cho tất cả subscriber
router.post('/notifications/send/:productId', inventoryController.postSendNotifications);

// ========================= API ENDPOINTS =========================

// API lấy lịch sử tồn kho sản phẩm
router.get('/api/product/:productId/history', inventoryController.apiGetProductHistory);

// API lấy thống kê nhanh
router.get('/api/stats', inventoryController.apiGetStats);

module.exports = router;
