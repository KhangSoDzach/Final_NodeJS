const User = require('../models/user');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

exports.getProfile = async (req, res) => {
  try {
    // Get recent orders
    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('user/profile', {
      title: 'Thông tin tài khoản',
      user: req.user,
      recentOrders
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thông tin tài khoản.');
    res.redirect('/');
  }
};

exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/user/profile');
  }
  
  try {
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          name,
          phone
        }
      }
    );
    
    req.flash('success', 'Thông tin tài khoản đã được cập nhật.');
    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật thông tin tài khoản.');
    res.redirect('/user/profile');
  }
};

exports.getAddresses = async (req, res) => {
  try {
    res.render('user/addresses', {
      title: 'Địa chỉ của tôi',
      addresses: req.user.addresses
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải địa chỉ.');
    res.redirect('/user/profile');
  }
};

exports.addAddress = async (req, res) => {
  const { street, district, province, isDefault } = req.body;
  
  try {
    // If this is the default address, unset other default addresses
    if (isDefault) {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { "addresses.$[].default": false } }
      );
    }
    
    await User.updateOne(
      { _id: req.user._id },
      {
        $push: {
          addresses: {
            street,
            district,
            province,
            default: isDefault ? true : false
          }
        }
      }
    );
    
    req.flash('success', 'Địa chỉ đã được thêm thành công.');
    res.redirect('/user/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thêm địa chỉ.');
    res.redirect('/user/addresses');
  }
};

exports.updateAddress = async (req, res) => {
  const { addressId, street, district, province, isDefault } = req.body;
  
  try {
    // If this is the default address, unset other default addresses
    if (isDefault) {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { "addresses.$[].default": false } }
      );
    }
    
    await User.updateOne(
      { _id: req.user._id, "addresses._id": addressId },
      {
        $set: {
          "addresses.$.street": street,
          "addresses.$.district": district,
          "addresses.$.province": province,
          "addresses.$.default": isDefault ? true : false
        }
      }
    );
    
    req.flash('success', 'Địa chỉ đã được cập nhật.');
    res.redirect('/user/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật địa chỉ.');
    res.redirect('/user/addresses');
  }
};

exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { addresses: { _id: addressId } } }
    );
    
    req.flash('success', 'Địa chỉ đã được xóa.');
    res.redirect('/user/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi xóa địa chỉ.');
    res.redirect('/user/addresses');
  }
};

exports.getChangePassword = (req, res) => {
  if (req.user.googleId) {
    req.flash('error', 'Tài khoản của bạn đăng nhập qua Google không thể thay đổi mật khẩu.');
    return res.redirect('/user/profile');
  }
  
  res.render('user/change-password', {
    title: 'Đổi mật khẩu'
  });
};

exports.postChangePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  
  if (req.user.googleId) {
    req.flash('error', 'Tài khoản của bạn đăng nhập qua Google không thể thay đổi mật khẩu.');
    return res.redirect('/user/profile');
  }
  
  if (newPassword !== confirmNewPassword) {
    req.flash('error', 'Mật khẩu mới không khớp.');
    return res.redirect('/user/change-password');
  }
  
  try {
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      req.flash('error', 'Mật khẩu hiện tại không chính xác.');
      return res.redirect('/user/change-password');
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { _id: req.user._id },
      { $set: { password: hashedPassword } }
    );
    
    req.flash('success', 'Mật khẩu đã được cập nhật thành công.');
    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thay đổi mật khẩu.');
    res.redirect('/user/change-password');
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('user/orders', {
      title: 'Lịch sử đơn hàng',
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải lịch sử đơn hàng.');
    res.redirect('/user/profile');
  }
};

exports.getLoyaltyPoints = async (req, res) => {
  try {
    // Get points history from orders
    const pointsHistory = await Order.find({
      user: req.user._id,
      $or: [
        { loyaltyPointsEarned: { $gt: 0 } },
        { loyaltyPointsUsed: { $gt: 0 } }
      ]
    })
    .select('orderNumber createdAt loyaltyPointsEarned loyaltyPointsUsed')
    .sort({ createdAt: -1 });
    
    res.render('user/loyalty-points', {
      title: 'Điểm tích lũy',
      currentPoints: req.user.loyaltyPoints,
      pointsHistory
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thông tin điểm tích lũy.');
    res.redirect('/user/profile');
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('items.product');

    if (!order || order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/user/orders');
    }

    res.render('orders/detail', {
      title: `Chi tiết đơn hàng #${order.orderNumber}`,
      order,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải chi tiết đơn hàng.');
    res.redirect('/user/orders');
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Tìm đơn hàng theo ID và kiểm tra quyền sở hữu
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/user/orders');
    }

    // Kiểm tra trạng thái đơn hàng (chỉ cho phép hủy nếu chưa giao hàng)
    if (order.status === 'shipped' || order.status === 'delivered') {
      req.flash('error', 'Không thể hủy đơn hàng đã được giao.');
      return res.redirect('/user/orders');
    }    // Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      date: Date.now(),
      note: 'Đơn hàng đã được hủy bởi người dùng.',
    });
    
    // Nếu đơn hàng đã được xác nhận thanh toán và có sử dụng coupon, giảm số lượt đã dùng của coupon
    if (order.paymentStatus === 'paid' && order.couponCode) {
      try {
        const Coupon = require('../models/coupon');
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: -1 } }
        );
        console.log(`Decremented usedCount for coupon: ${order.couponCode} due to order cancellation by user`);
      } catch (couponError) {
        console.error('Error updating coupon usedCount on cancel:', couponError);
      }
    }
    
    await order.save();

    req.flash('success', 'Đơn hàng đã được hủy thành công.');
    res.redirect('/user/orders');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi hủy đơn hàng.');
    res.redirect('/user/orders');
  }
};
