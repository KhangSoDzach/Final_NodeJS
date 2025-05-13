const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const emailService = require('../utils/emailService');

// Order Creation
exports.createOrder = async (req, res) => {
  try {
    const { paymentDetails } = req.body;

    // Find the user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);

    // Create order
    const order = new Order({
      user: req.user._id,
      items: cart.items,
      totalAmount,
      paymentDetails,
      status: 'pending',
      statusHistory: [{ status: 'pending', date: Date.now(), note: 'Đơn hàng đã được tạo.' }]
    });

    await order.save();    // Clear the user's cart
    cart.items = [];
    await cart.save();

    // Send confirmation email using the email service
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

    // Show success screen
    res.render('orders/success', {
      title: 'Đặt hàng thành công',
      order
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tạo đơn hàng.' });
  }
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

    // Calculate loyalty points
    const loyaltyPoints = Math.floor(order.totalAmount * 0.1);

    // Update user's loyalty points
    req.user.loyaltyPoints += loyaltyPoints;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: `Bạn đã nhận được ${loyaltyPoints} điểm tích lũy.`,
      currentPoints: req.user.loyaltyPoints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi áp dụng điểm tích lũy.' });
  }
};

exports.postCheckout = async (req, res) => {
  try {
    const { name, address, phone, paymentMethod } = req.body;

    // Lấy giỏ hàng của người dùng
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }

    // Tính tổng tiền
    const totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Tạo mã đơn hàng duy nhất
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Tạo đơn hàng
    const order = new Order({
      orderNumber, // Gán giá trị cho orderNumber
      user: req.user._id,
      items: cart.items,
      totalAmount,
      paymentDetails: { method: paymentMethod },
      shippingAddress: { name, address, phone },
      status: 'pending',
      statusHistory: [{ status: 'pending', date: Date.now(), note: 'Đơn hàng đã được tạo.' }]
    });

    await order.save();

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

exports.getCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }

    res.render('orders/checkout', {
      title: 'Thanh toán',
      cart
    });
  } catch (err) {
    console.error('Lỗi khi tải trang thanh toán:', err);
    res.status(500).send('Đã xảy ra lỗi khi tải trang thanh toán.');
  }
};