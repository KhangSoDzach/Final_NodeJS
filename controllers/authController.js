const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.postLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Tìm người dùng theo email
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Email hoặc mật khẩu không đúng.');
            return res.redirect('/auth/login');
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Email hoặc mật khẩu không đúng.');
            return res.redirect('/auth/login');
        }

        // Lưu thông tin người dùng vào session
        req.session.user = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
        };
        req.session.isAuthenticated = true;
        req.session.isAdmin = user.role === 'admin';

        // Đảm bảo session được lưu trước khi chuyển hướng
        return req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return next(err);
            }

            // Login thông qua Passport
            req.login(user, (err) => {
                if (err) {
                    console.error('Passport login error:', err);
                    return next(err);
                }

                console.log('Login successful:', {
                    role: user.role,
                    sessionIsAdmin: req.session.isAdmin,
                    userInSession: req.session.user ? req.session.user.email : null,
                    passportUser: req.user ? req.user.email : null
                });

                if (user.role === 'admin') {
                    return res.redirect('/admin/dashboard');
                } else {
                    return res.redirect('/');
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'Đã xảy ra lỗi khi đăng nhập.');
        return res.redirect('/auth/login');
    }
};