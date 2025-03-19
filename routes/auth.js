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
    body('password')
      .isLength({ min: 6 })
      .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
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

// Forgot password routes
router.get('/forgot-password', isGuest, authController.getForgotPassword);
router.post('/forgot-password', isGuest, authController.postForgotPassword);

// Reset password routes
router.get('/reset-password/:token', isGuest, authController.getResetPassword);
router.post('/reset-password', isGuest, authController.postResetPassword);

// Logout route
router.get('/logout', isAuth, authController.getLogout);

module.exports = router;
