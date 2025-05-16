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
    const { code, description, discount, minAmount, maxUses, active } = req.body;

    // Debug log to see what data is being received
    console.log('Received coupon data:', req.body);

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
    
    // Parse maxUses appropriately - null means unlimited
    let parsedMaxUses = null;
    if (maxUses && maxUses !== '0') {
      parsedMaxUses = parseInt(maxUses);
      if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
        req.flash('error', 'Số lần sử dụng tối đa không hợp lệ.');
        return res.redirect('/admin/coupons/add');
      }
    }
    
    // Create coupon with proper date handling
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discount: parseFloat(discount),
      minAmount: parseFloat(minAmount) || 0,
      startDate: new Date(), // Set to current date
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default to 90 days from now
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
    await Coupon.findByIdAndDelete(couponId);
    req.flash('success', 'Coupon đã được xóa thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi xóa coupon.');
    res.redirect('/admin/coupons');
  }
};