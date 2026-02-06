const Coupon = require('../models/coupon');

// Lấy danh sách coupon
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render('admin/coupons/index', { title: 'Quản lý Coupon', coupons, path: '/admin/coupons' });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách coupon.');
    res.redirect('/admin');
  }
};

// Thêm coupon mới
exports.postAddCoupon = async (req, res) => {  try {
    const { code, description, discount, minAmount, maxUses, active } = req.body;

    // Debug log to see what data is being received
    console.log('Received coupon data:', req.body);

    if (!code) {
      req.flash('error', 'Mã giảm giá không được để trống.');
      return res.redirect('/admin/coupons/add');
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      req.flash('error', 'Mã giảm giá này đã tồn tại.');
      return res.redirect('/admin/coupons/add');
    }
    
    // Validate coupon code length
    if (code.length !== 5) {
      req.flash('error', 'Mã giảm giá phải có đúng 5 ký tự.');
      return res.redirect('/admin/coupons/add');
    }
      // Parse maxUses appropriately with max limit of 10
      let parsedMaxUses = 10; // Default to max 10 uses
      if (typeof maxUses !== 'undefined' && maxUses !== null && maxUses !== '') {
        parsedMaxUses = parseInt(maxUses);
        if (isNaN(parsedMaxUses) || parsedMaxUses < 1 || parsedMaxUses > 10) {
          req.flash('error', 'Số lần sử dụng tối đa phải từ 1 đến 10.');
          return res.redirect('/admin/coupons/add');
        }
      }
      // Create coupon with usage limit
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discount: parseFloat(discount),
      minAmount: parseFloat(minAmount) || 0,
      maxUses: parsedMaxUses,
      active: active === 'on' || active === true
    });

    await coupon.save();
    req.flash('success', 'Coupon đã được thêm thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error('Coupon creation error:', err);
    req.flash('error', `Đã xảy ra lỗi khi thêm mã giảm giá: ${err.message}`);
    res.redirect('/admin/coupons/add');
  }
};

// Xóa coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const deleted = await Coupon.findByIdAndDelete(couponId);
    if (!deleted) {
      req.flash('error', 'Coupon không tồn tại.');
      return res.redirect('/admin/coupons');
    }
    req.flash('success', 'Coupon đã được xóa thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi xóa coupon.');
    res.redirect('/admin/coupons');
  }
};

// Hiển thị form thêm coupon
exports.getAddCoupon = (req, res) => {
  res.render('admin/coupons/add', {
    title: 'Thêm mã giảm giá mới',
    path: '/admin/coupons'
  });
};