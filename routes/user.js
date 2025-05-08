const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const userController = require('../controllers/user');
const { isAuth } = require('../middleware/auth');

// Get user profile
router.get('/profile', isAuth, userController.getProfile);

// Update user profile
router.post(
  '/profile',
  isAuth,
  [
    body('name').trim().not().isEmpty().withMessage('Vui lòng nhập tên của bạn'),
    body('phone')
      .optional({ checkFalsy: true })
      .isMobilePhone('vi-VN')
      .withMessage('Vui lòng nhập số điện thoại hợp lệ')
  ],
  userController.updateProfile
);

// Address management
router.get('/addresses', isAuth, userController.getAddresses);
router.post('/addresses/add', isAuth, userController.addAddress);
router.post('/addresses/update', isAuth, userController.updateAddress);
router.get('/addresses/delete/:addressId', isAuth, userController.deleteAddress);

// Password management
router.get('/change-password', isAuth, userController.getChangePassword);
router.post('/change-password', isAuth, userController.postChangePassword);

// Order history
router.get('/orders', isAuth, userController.getUserOrders);
router.get('/orders/:orderId', isAuth, userController.getOrderDetail);

// Route để hủy đơn hàng
router.post('/orders/:orderId/cancel', isAuth, userController.cancelOrder);

// Loyalty points
router.get('/loyalty-points', isAuth, userController.getLoyaltyPoints);

module.exports = router;
