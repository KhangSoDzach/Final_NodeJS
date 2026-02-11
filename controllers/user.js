const User = require('../models/user');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { SUPPORTED_LOCALES } = require('../utils/localeFormatter');
const { isSupportedCurrency } = require('../config/currencies');

exports.getProfile = async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
  const { name, email, phone } = req.body;


  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/user/profile');
  }

  try {
    const userId = req.user._id;
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    console.log('UpdateProfile Duplicate Check:', { email, userId, existingUser });
    if (existingUser) {
      req.flash('error', 'Email đã tồn tại.');
      return res.redirect('/user/profile');
    }


    await User.updateOne(
      { _id: userId },
      {
        $set: {
          name,
          email,
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
  const { street, district, province, city, state, isDefault, fullName, phone } = req.body;
  const finalDistrict = district || state;
  const finalProvince = province || city;

  if (!street || !finalDistrict || !finalProvince) {
    req.flash('error', 'Vui lòng điền đầy đủ thông tin địa chỉ.');
    return res.redirect('/user/addresses');
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error', 'Không tìm thấy người dùng.');
      return res.redirect('/');
    }

    // If this is the default address, unset other default addresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.default = false);
    }

    user.addresses.push({
      fullName: fullName || user.name,
      phone: phone || user.phone,
      street,
      district: finalDistrict,
      province: finalProvince,
      default: isDefault ? true : false

    });

    await user.save();

    req.flash('success', 'Địa chỉ đã được thêm thành công.');
    res.redirect('/user/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thêm địa chỉ.');
    res.redirect('/user/addresses');
  }
};


exports.updateAddress = async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
  const { addressId, street, district, province, city, state, isDefault, fullName, phone } = req.body;
  const finalDistrict = district || state;
  const finalProvince = province || city;

  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId || req.params.addressId);

    if (!address) {
      req.flash('error', 'Không tìm thấy địa chỉ.');
      return res.redirect('/user/addresses');
    }

    // If this is the default address, unset other default addresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.default = false);
    }

    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.street = street || address.street;
    address.district = finalDistrict || address.district;
    address.province = finalProvince || address.province;

    address.default = isDefault ? true : false;

    await user.save();

    req.flash('success', 'Địa chỉ đã được cập nhật.');
    res.redirect('/user/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật địa chỉ.');
    res.redirect('/user/addresses');
  }
};


exports.deleteAddress = async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
  const { currentPassword, newPassword, confirmNewPassword, confirmPassword } = req.body;
  const finalConfirm = confirmNewPassword || confirmPassword;

  if (req.user.googleId) {
    req.flash('error', 'Tài khoản của bạn đăng nhập qua Google không thể thay đổi mật khẩu.');
    return res.redirect('/user/profile');
  }

  if (newPassword !== finalConfirm) {
    req.flash('error', 'Mật khẩu mới không khớp.');
    return res.redirect('/user/change-password');
  }

  if (newPassword.length < 6) {
    req.flash('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
  try {

    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('items.product');

    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/user/orders');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Bạn không có quyền xem đơn hàng này.');
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
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/auth/login');
  }
  try {

    const { orderId } = req.params;

    // Tìm đơn hàng theo ID và kiểm tra quyền sở hữu
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/user/orders');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Bạn không có quyền hủy đơn hàng này.');
      return res.redirect('/user/orders');
    }


    // Kiểm tra trạng thái đơn hàng (chỉ cho phép hủy nếu chưa giao hàng)
    console.log('CancelOrder Check:', { orderId, status: order.status });
    if (order.status === 'shipping' || order.status === 'shipped' || order.status === 'delivered') {
      req.flash('error', 'Không thể hủy đơn hàng đã được giao hoặc đang vận chuyển.');
      return res.redirect('/user/orders');
    }


    // BUG-002 FIX: Hoàn trả tồn kho cho từng sản phẩm trong đơn hàng
    const Product = require('../models/product');
    for (const item of order.items) {
      try {
        const product = await Product.findById(item.product._id || item.product);
        if (product) {
          // Hoàn trả stock cho variant nếu có
          if (item.variants && Object.keys(item.variants).length > 0) {
            for (const [variantName, variantValue] of Object.entries(item.variants)) {
              const variant = product.variants.find(v => v.name === variantName);
              if (variant) {
                const option = variant.options.find(o => o.value === variantValue);
                if (option) {
                  option.stock += item.quantity;
                }
              }
            }
          } else {
            // Hoàn trả stock cho sản phẩm chính
            product.stock += item.quantity;
          }
          // Giảm số lượng đã bán
          product.sold = Math.max(0, product.sold - item.quantity);
          await product.save();
          console.log(`Restored ${item.quantity} stock for product ${product.name}`);
        }
      } catch (stockError) {
        console.error('Error restoring stock:', stockError);
      }
    }

    // BUG-003 FIX: Hoàn trả Loyalty Points đã sử dụng
    if (order.loyaltyPointsUsed > 0) {
      const User = require('../models/user');
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { loyaltyPoints: order.loyaltyPointsUsed } }
      );
      console.log(`Restored ${order.loyaltyPointsUsed} loyalty points to user ${req.user._id}`);
    }

    // Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      date: Date.now(),
      note: 'Đơn hàng đã được hủy bởi người dùng.',
    });

    // Nếu có sử dụng coupon, giảm số lượt đã dùng của coupon
    if (order.couponCode) {
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

    req.flash('success', 'Đơn hàng đã được hủy thành công. Tồn kho và điểm tích lũy đã được hoàn trả.');
    res.redirect('/user/orders');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi hủy đơn hàng.');
    res.redirect('/user/orders');
  }
};

/**
 * Update user locale preferences (language and currency)
 * POST /api/user/locale
 */
exports.updateLocalePreference = async (req, res) => {
  try {
    const { locale, currency } = req.body;
    const updates = {};
    
    // Validate and set language preference
    if (locale && SUPPORTED_LOCALES[locale]) {
      updates.preferredLanguage = locale;
      res.cookie('locale', locale, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    
    // Validate and set currency preference
    if (currency && isSupportedCurrency(currency)) {
      updates.preferredCurrency = currency.toUpperCase();
      res.cookie('currency', currency.toUpperCase(), {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    
    // Update user in database if logged in
    if (req.user && Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, updates);
    }
    
    res.json({
      success: true,
      locale: updates.preferredLanguage || req.locale,
      currency: updates.preferredCurrency || req.currency,
      message: 'Cập nhật tùy chọn ngôn ngữ thành công'
    });
  } catch (error) {
    console.error('Error updating locale preference:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tùy chọn ngôn ngữ'
    });
  }
};

/**
 * Get user locale preferences
 * GET /api/user/locale
 */
exports.getLocalePreference = async (req, res) => {
  try {
    res.json({
      success: true,
      locale: req.locale,
      currency: req.currency,
      user: req.user ? {
        preferredLanguage: req.user.preferredLanguage,
        preferredCurrency: req.user.preferredCurrency
      } : null
    });
  } catch (error) {
    console.error('Error getting locale preference:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy tùy chọn ngôn ngữ'
    });
  }
};
