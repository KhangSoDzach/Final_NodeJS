const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const ApiResponse = require('../../utils/apiResponse');

// POST /api/auth/register - Register new user
router.post('/register', async(req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validation
        if (!name || !email || !password) {
            return ApiResponse.error(res, 'Vui lòng điền đầy đủ thông tin', 400);
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return ApiResponse.error(res, 'Email đã được sử dụng', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone
        });

        await user.save();

        // Auto login after registration
        req.login(user, (err) => {
            if (err) {
                return ApiResponse.error(res, 'Đăng ký thành công nhưng đăng nhập thất bại', 500);
            }

            return ApiResponse.success(res, {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }, 'Đăng ký thành công', 201);
        });

    } catch (error) {
        console.error('Register error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi đăng ký', 500);
    }
});

// POST /api/auth/login - Login user
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return ApiResponse.error(res, 'Đã xảy ra lỗi khi đăng nhập', 500);
        }

        if (!user) {
            return ApiResponse.error(res, info.message || 'Email hoặc mật khẩu không đúng', 401);
        }

        req.login(user, (loginErr) => {
            if (loginErr) {
                return ApiResponse.error(res, 'Đã xảy ra lỗi khi đăng nhập', 500);
            }

            return ApiResponse.success(res, {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }, 'Đăng nhập thành công');
        });
    }) (req, res, next);
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return ApiResponse.error(res, 'Đã xảy ra lỗi khi đăng xuất', 500);
        }
        return ApiResponse.success(res, null, 'Đăng xuất thành công');
    });
});

// GET /api/auth/me - Get current user
router.get('/me', (req, res) => {
    if (!req.isAuthenticated()) {
        return ApiResponse.error(res, 'Chưa đăng nhập', 401);
    }

    return ApiResponse.success(res, {
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role
        }
    });
});

module.exports = router;
