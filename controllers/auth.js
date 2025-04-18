const User = require('../models/user');
const Cart = require('../models/cart');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// const mailer = require('../config/email');

// Login controllers
exports.getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  const returnTo = req.query.returnTo || '/';
  
  res.render('auth/login', {
    title: 'Đăng nhập',
    error: req.flash('error'),
    returnTo
  });
};

exports.postLogin = (req, res, next) => {
  const returnTo = req.query.returnTo || '/';
  
  passport.authenticate('local', {
    successRedirect: returnTo,
    failureRedirect: `/auth/login?returnTo=${returnTo}`,
    failureFlash: true
  })(req, res, next);
};

// Register controllers
exports.getRegister = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  res.render('auth/register', {
    title: 'Đăng ký',
    error: req.flash('error')
  });
};

exports.postRegister = async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate form data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('auth/register', {
      title: 'Đăng ký',
      error: req.flash('error'),
      name,
      email
    });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email đã tồn tại, vui lòng sử dụng email khác.');
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: req.flash('error'),
        name,
        email: ''
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'customer'
    });
    
    await newUser.save();
    
    // Move guest cart to user cart if exists
    if (req.session.cartId) {
      const guestCart = await Cart.findOne({ sessionId: req.session.cartId });
      
      if (guestCart) {
        guestCart.user = newUser._id;
        guestCart.sessionId = null;
        await guestCart.save();
        
        delete req.session.cartId;
      }
    }
    
    // Login the user after registration
    req.login(newUser, (err) => {
      if (err) {
        console.error('Error logging in after registration:', err);
        req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        return res.redirect('/auth/login');
      }
      
      req.flash('success', 'Đăng ký thành công!');
      res.redirect('/');
    });
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    res.redirect('/auth/register');
  }
};

// Google OAuth controllers
exports.getGoogleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

exports.getGoogleCallback = (req, res, next) => {
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  
  passport.authenticate('google', {
    successRedirect: returnTo,
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
};

// Forgot password controllers
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Quên mật khẩu',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Email không tồn tại trong hệ thống.');
      return res.redirect('/auth/forgot-password');
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
    await mailer.sendPasswordResetEmail(user.email, resetUrl);
    
    req.flash('success', 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
    res.redirect('/auth/forgot-password');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Đã xảy ra lỗi khi gửi email khôi phục mật khẩu. Vui lòng thử lại.');
    res.redirect('/auth/forgot-password');
  }
};

// Reset password controllers
exports.getResetPassword = async (req, res) => {
  const { token } = req.params;
  
  try {
    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error', 'Liên kết không hợp lệ hoặc đã hết hạn.');
      return res.redirect('/auth/forgot-password');
    }
    
    res.render('auth/reset-password', {
      title: 'Đặt lại mật khẩu',
      error: req.flash('error'),
      token
    });
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    res.redirect('/auth/forgot-password');
  }
};

exports.postResetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  
  // Validate passwords
  if (password !== confirmPassword) {
    req.flash('error', 'Mật khẩu không khớp.');
    return res.redirect(`/auth/reset-password/${token}`);
  }
  
  try {
    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error', 'Liên kết không hợp lệ hoặc đã hết hạn.');
      return res.redirect('/auth/forgot-password');
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    
    await user.save();
    
    req.flash('success', 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.');
    res.redirect(`/auth/reset-password/${token}`);
  }
};

// Logout controller
exports.getLogout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    
    res.redirect('/');
  });
};
