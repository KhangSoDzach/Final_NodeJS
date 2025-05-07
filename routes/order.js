const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/auth');

// Order Creation
router.post('/create', isAuth, orderController.createOrder);

// Order Tracking
router.get('/track/:orderId', isAuth, orderController.trackOrder);

// Order History
router.get('/history', isAuth, orderController.getOrderHistory);

// Apply Loyalty Points
router.post('/apply-loyalty/:orderId', isAuth, orderController.applyLoyaltyPoints);

// Route hiển thị trang thanh toán
router.get('/checkout', isAuth, orderController.getCheckout);

// Route xử lý xác nhận thanh toán
router.post('/checkout', isAuth, orderController.postCheckout);

// Route hiển thị trang success
router.get('/success/:orderId', isAuth, async (req, res) => {
  const orderId = req.params.orderId;
  res.render('orders/success', { title: 'Đặt hàng thành công', orderId });
});



module.exports = router;