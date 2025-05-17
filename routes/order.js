const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const { isAuth, allowGuest } = require('../middleware/auth');

// Order Creation
router.post('/create', allowGuest, orderController.createOrder);

// Order Tracking
router.get('/track/:orderId', allowGuest, orderController.trackOrder);

// Order History
router.get('/history', isAuth, orderController.getOrderHistory);

// Apply Loyalty Points
router.post('/apply-loyalty/:orderId', isAuth, orderController.applyLoyaltyPoints);

// Route hiển thị trang thanh toán
router.get('/checkout', allowGuest, orderController.getCheckout);

// Route xử lý xác nhận thanh toán
router.post('/checkout', allowGuest, orderController.postCheckout);

// Route hiển thị trang success - Đảm bảo khách không đăng nhập vẫn xem được
router.get('/success/:orderId', allowGuest, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await require('../models/order').findById(orderId);
    
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect(req.user ? '/orders/history' : '/');
    }
    
    // Check if order belongs to the current user (if logged in)
    // For guest users, we'll use the session to verify access
    if (req.user && order.user) {
      if (order.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'Bạn không có quyền xem đơn hàng này.');
        return res.redirect('/orders/history');
      }
    } else if (!req.session.guestOrderIds || !req.session.guestOrderIds.includes(orderId)) {
      // For guests, check if this order ID is in their session
      req.flash('error', 'Bạn không có quyền xem đơn hàng này.');
      return res.redirect('/');
    }
      // Pass coupon information to the view
    const couponApplied = order.couponCode ? true : false;
    const couponCode = order.couponCode || '';
    const discountPercent = order.discount || 0;
      // Get current user's loyalty points if user is logged in
    let currentLoyaltyPoints = 0;
    if (req.user) {
      const user = await require('../models/user').findById(req.user._id);
      currentLoyaltyPoints = user ? user.loyaltyPoints : 0;
    }
    
    res.render('orders/success', { 
      title: 'Đặt hàng thành công', 
      orderId,
      couponApplied,
      couponCode,
      discountPercent,
      order,
      currentLoyaltyPoints,
      isGuest: !req.user
    });  } catch (err) {
    console.error('Error loading order success page:', err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang thành công.');
    res.redirect(req.user ? '/orders/history' : '/');
  }
});



module.exports = router;