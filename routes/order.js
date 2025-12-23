const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/auth');
const { initGuestCart } = require('../middleware/guestCart');

// =============================================
// GUEST CHECKOUT ROUTES (Không cần đăng nhập)
// =============================================

// Guest checkout page
router.get('/guest-checkout', initGuestCart, orderController.getGuestCheckout);

// Process guest checkout
router.post('/guest-checkout', initGuestCart, orderController.postGuestCheckout);

// Guest order success
router.get('/guest-success/:orderId', orderController.getGuestSuccess);

// Track guest order by token
router.get('/track-guest/:token', orderController.trackGuestOrder);

// Track order page (public - cho phép nhập mã)
router.get('/track', (req, res) => {
  res.render('orders/track-form', { title: 'Theo dõi đơn hàng' });
});

// =============================================
// INVOICE ROUTES
// =============================================

// View invoice (HTML - cả guest và user)
router.get('/invoice/:orderId', orderController.getInvoice);

// Download invoice PDF
router.get('/invoice/:orderId/pdf', orderController.downloadInvoicePDF);

// Request VAT invoice for existing order
router.post('/request-vat-invoice/:orderId', isAuth, orderController.requestVatInvoice);

// Calculate VAT preview (API)
router.post('/calculate-vat', orderController.calculateVatPreview);

// =============================================
// ONE-CLICK CHECKOUT
// =============================================

// One-click checkout (AJAX)
router.post('/one-click-checkout', isAuth, orderController.oneClickCheckout);

// Get user addresses for autofill
router.get('/addresses', isAuth, orderController.getUserAddresses);

// =============================================
// AUTHENTICATED ROUTES
// =============================================

// Order Creation (deprecated - redirect to checkout)
router.post('/create', isAuth, orderController.createOrder);

// Order Tracking (for logged in users)
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
  try {
    const orderId = req.params.orderId;
    const order = await require('../models/order').findById(orderId);
    
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/orders/history');
    }
    
    // Check if order belongs to the current user
    if (order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Bạn không có quyền xem đơn hàng này.');
      return res.redirect('/orders/history');
    }
      // Pass coupon information to the view
    const couponApplied = order.couponCode ? true : false;
    const couponCode = order.couponCode || '';
    const discountPercent = order.discount || 0;
    
    // Get current user's loyalty points
    const user = await require('../models/user').findById(req.user._id);
    const currentLoyaltyPoints = user ? user.loyaltyPoints : 0;
    
    res.render('orders/success', { 
      title: 'Đặt hàng thành công', 
      orderId,
      couponApplied,
      couponCode,
      discountPercent,
      order,
      currentLoyaltyPoints,
      isGuest: false
    });
  } catch (err) {
    console.error('Error loading order success page:', err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang thành công.');
    res.redirect('/orders/history');
  }
});



module.exports = router;