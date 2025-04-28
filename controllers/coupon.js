const Coupon = require('../models/coupon');

// Lấy danh sách coupon
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render('admin/coupons/index', { title: 'Quản lý Coupon', coupons });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách coupon.');
    res.redirect('/admin');
  }
};

// Thêm coupon mới
exports.postAddCoupon = async (req, res) => {
  try {
    const { code, description, discount, minAmount, startDate, endDate, maxUses, active } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      req.flash('error', 'Mã giảm giá này đã tồn tại.');
      return res.redirect('/admin/coupons/add');
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discount: parseFloat(discount),
      minAmount: parseFloat(minAmount) || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxUses: maxUses ? parseInt(maxUses) : null,
      active: active === 'on' || active === true
    });

    await coupon.save();
    req.flash('success', 'Coupon đã được thêm thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thêm coupon.');
    res.redirect('/admin/coupons/add');
  }
};

// Xóa coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    await Coupon.findByIdAndDelete(couponId);
    req.flash('success', 'Coupon đã được xóa thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi xóa coupon.');
    res.redirect('/admin/coupons');
  }
};