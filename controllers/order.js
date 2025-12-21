const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const emailService = require('../utils/emailService');

// BUG-006 FIX: Function này đã deprecated, sử dụng postCheckout thay thế
// Để tránh trừ stock 2 lần, route /orders/create sẽ redirect tới /orders/checkout
exports.createOrder = async (req, res) => {
  // Redirect tới checkout page thay vì xử lý trực tiếp
  req.flash('error', 'Vui lòng sử dụng trang thanh toán để đặt hàng.');
  return res.redirect('/orders/checkout');
};

// Order Tracking
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('items.product');
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    res.render('orders/track', { title: `Theo dõi đơn hàng #${order._id}`, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi theo dõi đơn hàng.' });
  }
};

// Order History
exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.render('orders/history', {
      title: 'Lịch sử đơn hàng',
      orders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tải lịch sử đơn hàng.' });
  }
};

// Loyalty Programs
exports.applyLoyaltyPoints = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    
    // Kiểm tra xem đơn hàng đã được giao chưa
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Điểm tích lũy chỉ áp dụng khi đơn hàng đã được giao.' });
    }
      // Kiểm tra xem điểm tích lũy đã được cộng chưa
    if (!order.loyaltyPointsApplied) {
      // Lấy số điểm tích lũy đã được tính khi tạo đơn hàng
      const loyaltyPoints = order.loyaltyPointsEarned || Math.floor(order.totalAmount * 0.0001);
      
      // Cộng điểm tích lũy vào tài khoản người dùng
      req.user.loyaltyPoints += loyaltyPoints;
      await req.user.save();
      
      // Đánh dấu rằng điểm đã được cộng
      order.loyaltyPointsApplied = true;
      await order.save();
      
      console.log(`Added ${loyaltyPoints} loyalty points to user ${req.user._id} for order ${order._id}`);
      
      res.status(200).json({
        success: true,
        message: `Bạn đã nhận được ${loyaltyPoints} điểm tích lũy.`,
        currentPoints: req.user.loyaltyPoints
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Điểm tích lũy đã được áp dụng cho đơn hàng này.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi áp dụng điểm tích lũy.' });
  }
};

exports.postCheckout = async (req, res) => {
  try {
    const { name, address, district, province, phone, paymentMethod, loyaltyPointsToUse } = req.body;    // Lấy giỏ hàng của người dùng
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }    // Tính tổng tiền (có tính đến coupon nếu được áp dụng)
    let totalAmount = cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal();
    
    // Tự động sử dụng điểm tích lũy tối đa
    let loyaltyPointsUsed = 0;
    if (req.user.loyaltyPoints > 0) {
      // Tính số điểm tích lũy tối đa có thể sử dụng cho đơn hàng
      const maxPointsForOrder = Math.floor(totalAmount / 1000);
      
      // Sử dụng số điểm nhỏ nhất giữa điểm hiện có và điểm tối đa cho đơn hàng
      loyaltyPointsUsed = Math.min(req.user.loyaltyPoints, maxPointsForOrder);
      
      if (loyaltyPointsUsed > 0) {
        // Trừ giảm giá từ điểm tích lũy vào tổng tiền
        const loyaltyDiscount = loyaltyPointsUsed * 1000;
        totalAmount = Math.max(0, totalAmount - loyaltyDiscount);
        
        // Trừ điểm đã sử dụng khỏi tài khoản của người dùng
        req.user.loyaltyPoints -= loyaltyPointsUsed;
        await req.user.save();
      }    }
      // Tính điểm tích lũy sẽ nhận được khi đơn hàng được giao (0.01% giá trị đơn hàng)
    const loyaltyPointsEarned = Math.floor(totalAmount * 0.0001);
    
    // Lưu thông tin điểm tích lũy vào đơn hàng
    // Điểm tích lũy sẽ được thêm vào tài khoản người dùng khi admin xác nhận đơn hàng đã được giao

    // Tạo mã đơn hàng duy nhất
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;    // Tạo đơn hàng
    const order = new Order({
      orderNumber, // Gán giá trị cho orderNumber
      user: req.user._id,
      items: cart.items,
      totalAmount,
      paymentDetails: { method: paymentMethod },
      shippingAddress: { 
        name, 
        street: address, 
        district, 
        province, 
        phone 
      },
      status: 'pending',
      statusHistory: [{ status: 'pending', date: Date.now(), note: 'Đơn hàng đã được tạo.' }],
      loyaltyPointsUsed: loyaltyPointsUsed,
      loyaltyPointsEarned: loyaltyPointsEarned
    });    // Thêm thông tin giảm giá từ coupon (nếu có)
    if (cart.coupon && cart.coupon.code) {
      order.couponCode = cart.coupon.code;
      order.discount = cart.coupon.discount;
      
      // Tăng số lần sử dụng của coupon
      try {
        const Coupon = require('../models/coupon');
        await Coupon.findOneAndUpdate(
          { code: cart.coupon.code },
          { $inc: { usedCount: 1 } }
        );
        console.log(`Coupon ${cart.coupon.code} usage count increased.`);
      } catch (couponError) {
        console.error('Error updating coupon usedCount:', couponError);
        // Vẫn tiếp tục xử lý đơn hàng ngay cả khi không thể cập nhật số lượng coupon
      }
    }

    await order.save();
    
    // Cập nhật tồn kho và số lượng đã bán cho mỗi sản phẩm
    for (const item of cart.items) {
      const product = item.product;
      if (product) {
        // Kiểm tra xem có variant hay không
        if (item.variants && Object.keys(item.variants).length > 0) {
          // Nếu có variant, cập nhật cả variant và sản phẩm chính
          for (const [variantName, variantValue] of Object.entries(item.variants)) {
            product.updateStock(item.quantity, true, variantName, variantValue);
          }
        } else {
          // Nếu không có variant, chỉ cập nhật sản phẩm chính
          product.updateStock(item.quantity);
        }
        await product.save();
        console.log(`Đã cập nhật tồn kho và số lượng đã bán cho sản phẩm ${product.name}`);
      }
    }

    // Xóa giỏ hàng sau khi đặt hàng
    cart.items = [];
    await cart.save();

    // Gửi email xác nhận đơn hàng
    try {
      const populatedOrder = await Order.findById(order._id).populate({
        path: 'items.product',
        select: 'name images slug'
      });
      
      await emailService.sendOrderConfirmationEmail(req.user.email, populatedOrder);
      console.log(`Order confirmation email sent to ${req.user.email}`);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Continue execution even if email fails
    }

    // Chuyển hướng đến trang success
    res.redirect(`/orders/success/${order._id}`);
  } catch (err) {
    console.error('Lỗi khi xử lý thanh toán:', err);
    req.flash('error', 'Đã xảy ra lỗi khi xử lý thanh toán.');
    res.redirect('/orders/checkout');
  }
};

exports.getCheckout = async (req, res) => {  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }

    // Fetch complete user with addresses
    const user = await User.findById(req.user._id);

    // Find the default address for auto-selection
    let defaultAddress = null;
    if (user && user.addresses && user.addresses.length > 0) {
      defaultAddress = user.addresses.find(addr => addr.default === true);
    }

    // Tính toán số điểm tích lũy tối đa có thể sử dụng cho đơn hàng này
    const totalAmount = cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal();
    const maxPointsApplicable = Math.min(user.loyaltyPoints, Math.floor(totalAmount / 1000));

    res.render('orders/checkout', {      title: 'Thanh toán',
      cart,
      user,
      defaultAddress,
      loyaltyPoints: user.loyaltyPoints,
      maxPointsApplicable: maxPointsApplicable,
      loyaltyPointsValue: maxPointsApplicable * 1000
    });
  } catch (err) {
    console.error('Lỗi khi tải trang thanh toán:', err);
    res.status(500).send('Đã xảy ra lỗi khi tải trang thanh toán.');
  }
};