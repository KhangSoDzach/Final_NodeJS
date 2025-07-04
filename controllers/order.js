const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const emailService = require('../utils/emailService');

// Order Creation
exports.createOrder = async (req, res) => {
  try {
    const { paymentDetails, email } = req.body;
    
    // Find cart based on user or session ID
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }

    // Calculate total amount (including discount if coupon applied)
    const totalAmount = cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal();    // Create order
    const orderData = {
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      items: cart.items,
      totalAmount,
      paymentDetails,
      status: 'pending',
      statusHistory: [{ status: 'pending', date: Date.now(), note: 'Đơn hàng đã được tạo.' }]
    };
    
    // Add user reference if logged in, otherwise add email for guest
    if (req.user) {
      orderData.user = req.user._id;
    } else if (email) {
      orderData.guestEmail = email;
    }
    
    const order = new Order(orderData);// Add coupon information if coupon was applied
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
        // Continue processing the order even if we can't update the coupon count
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
    
    // Clear the user's cart
    cart.items = [];
    await cart.save();    // Send confirmation email using the email service
    try {
      const populatedOrder = await Order.findById(order._id).populate({
        path: 'items.product',
        select: 'name images slug'
      });
      
      const recipientEmail = req.user ? req.user.email : email;
      if (recipientEmail) {
        await emailService.sendOrderConfirmationEmail(recipientEmail, populatedOrder);
        console.log(`Order confirmation email sent to ${recipientEmail}`);
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Continue execution even if email fails
    }
    
    // If guest checkout, store the order ID in session for security verification
    if (!req.user) {
      // Initialize the array if it doesn't exist
      if (!req.session.guestOrderIds) {
        req.session.guestOrderIds = [];
      }
      // Add the current order ID to the session
      req.session.guestOrderIds.push(order._id.toString());
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
    
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect(req.user ? '/orders/history' : '/');
    }
    
    // For logged-in users, verify ownership
    if (req.user) {
      if (order.user && order.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'Bạn không có quyền truy cập đơn hàng này.');
        return res.redirect('/orders/history');
      }
    } else {
      // For guests, just check the session
      if (!req.session.guestOrderIds || !req.session.guestOrderIds.includes(orderId)) {
        req.flash('error', 'Bạn không có quyền truy cập đơn hàng này.');
        return res.redirect('/');
      }
    }
    
    res.render('orders/track', { 
      title: `Theo dõi đơn hàng #${order.orderNumber || order._id}`, 
      order,
      isGuest: !req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi theo dõi đơn hàng.');
    res.redirect(req.user ? '/orders/history' : '/');
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
    const { name, email, address, district, province, phone, paymentMethod, loyaltyPointsToUse } = req.body;
    
    // Find cart based on user or session ID
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }

    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }
    
    // Tính tổng tiền (có tính đến coupon nếu được áp dụng)
    let totalAmount = cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal();
    
    // Khởi tạo biến điểm tích lũy
    let loyaltyPointsUsed = 0;
    let loyaltyPointsEarned = 0;

    // Nếu người dùng đã đăng nhập, xử lý điểm tích lũy
    if (req.user) {
      const user = await User.findById(req.user._id);
      
      if (user.loyaltyPoints > 0 && loyaltyPointsToUse) {
        // Tính số điểm tích lũy tối đa có thể sử dụng cho đơn hàng
        const maxPointsForOrder = Math.floor(totalAmount / 1000);
        
        // Sử dụng số điểm nhỏ nhất giữa điểm hiện có, điểm tối đa cho đơn hàng và điểm người dùng muốn dùng
        loyaltyPointsUsed = Math.min(
          user.loyaltyPoints,
          maxPointsForOrder,
          parseInt(loyaltyPointsToUse) || 0
        );
        

        // Trừ điểm đã sử dụng khỏi tài khoản của người dùng
        req.user.loyaltyPoints -= loyaltyPointsUsed;
        await req.user.save();
      }    }
      // Tính điểm tích lũy sẽ nhận được khi đơn hàng được giao (0.01% giá trị đơn hàng)
    const loyaltyPointsEarned = Math.floor(totalAmount * 0.0001);
    
    // Lưu thông tin điểm tích lũy vào đơn hàng
    // Điểm tích lũy sẽ được thêm vào tài khoản người dùng khi admin xác nhận đơn hàng đã được giao


    // Tạo mã đơn hàng duy nhất
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Tạo đơn hàng với thông tin phù hợp cho cả khách và người dùng đã đăng nhập
    const orderData = {
      orderNumber,
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
    };

    // Thêm thông tin người dùng nếu đã đăng nhập, hoặc email khách nếu là khách
    if (req.user) {
      orderData.user = req.user._id;
    } else if (email) {
      orderData.guestEmail = email;
    }

    const order = new Order(orderData);

    // Thêm thông tin giảm giá từ coupon (nếu có)
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
      
      const recipientEmail = req.user ? req.user.email : email;
      if (recipientEmail) {
        await emailService.sendOrderConfirmationEmail(recipientEmail, populatedOrder);
        console.log(`Order confirmation email sent to ${recipientEmail}`);
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
    }    // If guest checkout, store the order ID in session for security verification
    if (!req.user) {
      // Initialize the array if it doesn't exist
      if (!req.session.guestOrderIds) {
        req.session.guestOrderIds = [];
      }
      // Add the current order ID to the session
      req.session.guestOrderIds.push(order._id.toString());
    }
    
    // Chuyển hướng đến trang success với thông tin đơn hàng
    return res.redirect(`/orders/success/${order._id}`);
  } catch (err) {
    console.error('Lỗi khi xử lý thanh toán:', err);
    req.flash('error', 'Đã xảy ra lỗi khi xử lý thanh toán.');
    return res.redirect('/orders/checkout');
  }
};

exports.getCheckout = async (req, res) => {
  try {
    // Find cart based on user or session ID
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }

    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }

    // Variables for user data
    let user = null;
    let defaultAddress = null;
    let loyaltyPoints = 0;
    let maxPointsApplicable = 0;

    // If user is logged in, fetch their data
    if (req.user) {
      user = await User.findById(req.user._id);

      // Find the default address for auto-selection
      if (user && user.addresses && user.addresses.length > 0) {
        defaultAddress = user.addresses.find(addr => addr.default === true);
      }

      // Calculate loyalty points
      loyaltyPoints = user.loyaltyPoints;
      const totalAmount = cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal();
      maxPointsApplicable = Math.min(loyaltyPoints, Math.floor(totalAmount / 1000));
    }

    // Render checkout page with appropriate data
    res.render('orders/checkout', {
      title: 'Thanh toán',
      cart,
      user,
      defaultAddress,
      loyaltyPoints,
      maxPointsApplicable,
      loyaltyPointsValue: maxPointsApplicable * 1000
    });
  } catch (err) {
    console.error('Lỗi khi tải trang thanh toán:', err);
    res.status(500).send('Đã xảy ra lỗi khi tải trang thanh toán.');
  }
};

