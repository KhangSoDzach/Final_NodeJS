const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const ApiResponse = require('../../utils/apiResponse');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return ApiResponse.error(res, 'Vui lòng đăng nhập', 401);
    }
    next();
};

// GET /api/user/profile - Get user profile
router.get('/profile', requireAuth, async(req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .lean();

        if (!user) {
            return ApiResponse.error(res, 'Không tìm thấy người dùng', 404);
        }

        return ApiResponse.success(res, user);

    } catch (error) {
        console.error('Get profile error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi tải thông tin người dùng', 500);
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', requireAuth, async(req, res) => {
    try {
        const { name, phone, address } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('-password');

        return ApiResponse.success(res, user, 'Cập nhật thông tin thành công');

    } catch (error) {
        console.error('Update profile error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi cập nhật thông tin', 500);
    }
});

// PUT /api/user/password - Change password
router.put('/password', requireAuth, async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return ApiResponse.error(res, 'Thiếu thông tin', 400);
        }

        if (newPassword.length < 6) {
            return ApiResponse.error(res, 'Mật khẩu mới phải có ít nhất 6 ký tự', 400);
        }

        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return ApiResponse.error(res, 'Mật khẩu hiện tại không đúng', 400);
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return ApiResponse.success(res, null, 'Đổi mật khẩu thành công');

    } catch (error) {
        console.error('Change password error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi đổi mật khẩu', 500);
    }
});

module.exports = router;
