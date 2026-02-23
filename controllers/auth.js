const User = require('../models/user');
const Cart = require('../models/cart');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { mergeGuestCart } = require('../middleware/guestCart');

// Import our email service
const mailer = require('../utils/emailService');

// Login controllers
exports.getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  const returnTo = req.query.returnTo || '/';
  const isBanned = req.query.banned === 'true';
  let errorMsg = req.flash('error');
  
  // If the banned parameter is present, set a specific error message
  if (isBanned && (!errorMsg || !errorMsg.length)) {
    errorMsg = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.';
  }
  
  res.render('auth/login', {
    title: 'Đăng nhập',
    error: errorMsg,
    success: req.flash('success'),
    returnTo,
    isBanned
  });
};

exports.postLogin = (req, res, next) => {
  const returnTo = req.query.returnTo || '/';
  
  // Add banned user check using a custom callback with passport.authenticate
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }    if (!user) {
      const errorMessage = info.message || 'Email hoặc mật khẩu không đúng.';
      req.flash('error', errorMessage);
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: errorMessage,
        success: '',
        returnTo
      });
    }    // Check if user is banned
    if (user.isBanned) {
      // Không sử dụng flash message mà chỉ redirect với banned parameter
      return res.redirect('/auth/login?banned=true');
    }
    
    // If user is valid and not banned, log them in
    req.login(user, async (err) => {
      if (err) {
        return next(err);
      }
      
      // Merge guest cart vào user cart sau khi đăng nhập
      try {
        await mergeGuestCart(req, user._id);
      } catch (mergeErr) {
        console.error('Error merging guest cart:', mergeErr);
      }
      
      // Save session before redirect to ensure login state is persisted
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        return res.redirect(returnTo);
      });
    });
  })(req, res, next);
};

// Register controllers
exports.getRegister = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  res.render('auth/register', {
    title: 'Đăng ký',
    error: req.flash('error'),
    success: req.flash('success')
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
      success: req.flash('success'),
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
        success: req.flash('success'),
        name,
        email: ''
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store registration data and OTP in session
    req.session.pendingRegistration = {
      name,
      email,
      password, // will be hashed after OTP verification
      otp,
      otpExpires,
      attempts: 0
    };

    // Send OTP email
    const emailSent = await mailer.sendOtpEmail(email, otp, name);
    if (!emailSent) {
      req.flash('error', 'Không thể gửi email xác thực. Vui lòng thử lại.');
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: req.flash('error'),
        success: req.flash('success'),
        name,
        email
      });
    }

    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.redirect('/auth/verify-otp');
    });

  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    res.redirect('/auth/register');
  }
};

// OTP Verification controllers
exports.getVerifyOtp = (req, res) => {
  if (!req.session.pendingRegistration) {
    return res.redirect('/auth/register');
  }
  const { email } = req.session.pendingRegistration;
  res.render('auth/verify-otp', {
    title: 'Xác thực email',
    email,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

exports.postVerifyOtp = async (req, res) => {
  const pending = req.session.pendingRegistration;

  if (!pending) {
    req.flash('error', 'Phiên đăng ký đã hết hạn. Vui lòng thực hiện lại.');
    return res.redirect('/auth/register');
  }

  // Check OTP expiry
  if (Date.now() > pending.otpExpires) {
    delete req.session.pendingRegistration;
    req.flash('error', 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
    return res.redirect('/auth/register');
  }

  // Max 5 attempts
  if (pending.attempts >= 5) {
    delete req.session.pendingRegistration;
    req.flash('error', 'Bạn đã nhập sai quá nhiều lần. Vui lòng đăng ký lại.');
    return res.redirect('/auth/register');
  }

  const enteredOtp = (req.body.otp || '').trim();

  if (enteredOtp !== pending.otp) {
    pending.attempts += 1;
    req.session.pendingRegistration = pending;
    const remaining = 5 - pending.attempts;
    req.flash('error', `Mã OTP không đúng. Còn ${remaining} lần thử.`);
    return res.render('auth/verify-otp', {
      title: 'Xác thực email',
      email: pending.email,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  // OTP correct — create user
  try {
    const { name, email, password } = pending;

    // Final check email not taken during OTP window
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      delete req.session.pendingRegistration;
      req.flash('error', 'Email đã được đăng ký bởi người khác. Vui lòng dùng email khác.');
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'customer'
    });
    await newUser.save();

    // Clear pending registration
    delete req.session.pendingRegistration;

    // Move guest cart if exists
    if (req.session.cartId) {
      const guestCart = await Cart.findOne({ sessionId: req.session.cartId });
      if (guestCart) {
        guestCart.user = newUser._id;
        guestCart.sessionId = null;
        await guestCart.save();
        delete req.session.cartId;
      }
    }

    // Auto login after registration
    req.login(newUser, (err) => {
      if (err) {
        console.error('Error logging in after registration:', err);
        req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        return res.redirect('/auth/login');
      }
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        req.flash('success', `Chào mừng ${name} đến với Source Computer! 🎉`);
        res.redirect('/');
      });
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    req.flash('error', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    res.redirect('/auth/register');
  }
};

exports.postResendOtp = async (req, res) => {
  const pending = req.session.pendingRegistration;

  if (!pending) {
    return res.redirect('/auth/register');
  }

  // Giới hạn resend: 1 lần/phút
  if (pending.lastResent && Date.now() - pending.lastResent < 60 * 1000) {
    req.flash('error', 'Vui lòng đợi 1 phút trước khi gửi lại mã.');
    return res.redirect('/auth/verify-otp');
  }

  // Tạo OTP mới
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  pending.otp = otp;
  pending.otpExpires = Date.now() + 10 * 60 * 1000;
  pending.attempts = 0;
  pending.lastResent = Date.now();
  req.session.pendingRegistration = pending;

  const emailSent = await mailer.sendOtpEmail(pending.email, otp, pending.name);

  req.session.save(() => {
    if (emailSent) {
      req.flash('success', 'Mã OTP mới đã được gửi đến email của bạn.');
    } else {
      req.flash('error', 'Không thể gửi email. Vui lòng thử lại.');
    }
    res.redirect('/auth/verify-otp');
  });
};

// Google OAuth controllers
exports.getGoogleAuth = (req, res, next) => {
  // Lưu lại đường dẫn trả về nếu có
  if (req.query.returnTo) {
    req.session.returnTo = req.query.returnTo;
  }
  
  console.log('Starting Google authentication, session ID:', req.sessionID);
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

exports.getGoogleCallback = (req, res, next) => {
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  
  console.log('Google callback received, session ID:', req.sessionID);
  console.log('Callback URL:', req.originalUrl);
  
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      req.flash('error', 'Đăng nhập bằng Google thất bại.');
      return res.redirect('/auth/login');
    }
      // Check if user is banned
    if (user.isBanned) {
      req.flash('error', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.');
      return res.redirect('/auth/login?banned=true');
    }
    
    // If user is valid and not banned, log them in
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Save session before redirect to ensure login state is persisted
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        req.flash('success', 'Đăng nhập thành công!');
        return res.redirect(returnTo);
      });
    });
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
    console.log(`Password reset requested for email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Email not found in database: ${email}`);
      req.flash('error', 'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.');
      return res.redirect('/auth/forgot-password');
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    
    await user.save();
    console.log(`Reset token generated for user: ${user._id}`);
    
    // Send reset email with improved URL and error handling
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
    console.log(`Reset URL generated: ${resetUrl}`);
    
    try {
      const emailSent = await mailer.sendPasswordResetEmail(user.email, resetUrl);
      
      if (emailSent) {
        console.log(`Password reset email sent successfully to: ${email}`);
        req.flash('success', 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn (và thư mục spam nếu cần).');
      } else {
        console.log(`Failed to send password reset email to: ${email}`);
        req.flash('error', 'Không thể gửi email khôi phục mật khẩu. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      req.flash('error', `Lỗi gửi email: ${emailError.message}. Vui lòng liên hệ quản trị viên.`);
    }
    
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
  // Token may be sent in body or params by tests
  const token = req.body.token || req.params.token;
  const { password, confirmPassword } = req.body;

  // Validate passwords when confirmPassword provided
  if (typeof confirmPassword !== 'undefined' && password !== confirmPassword) {
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
      return res.render('auth/reset-password', {
        title: 'Đặt lại mật khẩu',
        error: 'Liên kết không hợp lệ hoặc đã hết hạn.',
        token: token
      });
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
    
    // Save session before redirect to ensure logout state is persisted
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.redirect('/');
    });
  });
};
