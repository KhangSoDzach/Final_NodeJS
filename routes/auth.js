const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const { isGuest, isAuth } = require('../middleware/auth');

// Login routes
router.get('/login', isGuest, authController.getLogin);
router.post('/login', isGuest, authController.postLogin);

// Register routes
router.get('/register', isGuest, authController.getRegister);
router.post(
  '/register',
  isGuest,
  [
    body('name').trim().not().isEmpty().withMessage('Vui lòng nhập tên của bạn'),
    body('email')
      .isEmail()
      .withMessage('Vui lòng nhập một địa chỉ email hợp lệ')
      .normalizeEmail(),
    // BUG-010 FIX: Tăng cường password validation
    body('password')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
      .matches(/[A-Z]/)
      .withMessage('Mật khẩu phải có ít nhất 1 chữ hoa')
      .matches(/[a-z]/)
      .withMessage('Mật khẩu phải có ít nhất 1 chữ thường')
      .matches(/[0-9]/)
      .withMessage('Mật khẩu phải có ít nhất 1 chữ số'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu nhập lại không khớp');
      }
      return true;
    })
  ],
  authController.postRegister
);

// Google OAuth routes
router.get('/google', authController.getGoogleAuth);
router.get('/google/callback', authController.getGoogleCallback);

// OTP email verification (after register)
router.get('/verify-otp', authController.getVerifyOtp);
router.post('/verify-otp', authController.postVerifyOtp);
router.post('/resend-otp', authController.postResendOtp);

// Forgot password routes
router.get('/forgot-password', isGuest, authController.getForgotPassword);
router.post('/forgot-password', isGuest, authController.postForgotPassword);

// Reset password routes
router.get('/reset-password/:token', isGuest, authController.getResetPassword);
router.post('/reset-password', isGuest, authController.postResetPassword);

// Logout route
router.get('/logout', isAuth, authController.getLogout);

module.exports = router;
