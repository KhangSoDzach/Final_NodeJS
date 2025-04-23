const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const bcrypt = require('bcryptjs');

exports.getCheckout = async (req, res) => {
  try {
    // Get cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findOne({ sessionId: req.session.cartId }).populate('items.product');
    }
    
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng trống không thể thanh toán.');
      return res.redirect('/cart');
    }
    
    // Check if all products are in stock
    for (const item of cart.items) {
      if (!item.product) {
        req.flash('error', 'Một số sản phẩm trong giỏ hàng không còn tồn tại.');
        return res.redirect('/cart');
      }
      
      if (item.variant && item.variant.name && item.variant.value) {
        const variant = item.product.variants.find(v => v.name === item.variant.name);
        if (!variant) {
          req.flash('error', `Biến thể ${item.variant.name} của sản phẩm ${item.product.name} không còn tồn tại.`);
          return res.redirect('/cart');
        }
        
        const option = variant.options.find(o => o.value === item.variant.value);
        if (!option || option.stock < item.quantity) {
          req.flash('error', `Biến thể ${item.variant.value} của sản phẩm ${item.product.name} không đủ hàng.`);
          return res.redirect('/cart');
        }
      } else if (item.product.stock < item.quantity) {
        req.flash('error', `Sản phẩm ${item.product.name} không đủ hàng.`);
        return res.redirect('/cart');
      }
    }
    
    res.render('orders/checkout', {
      title: 'Thanh toán',
      cart,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang thanh toán.');
    res.redirect('/cart');
  }
};

exports.postOrder = async (req, res) => {
  try {
    // Get form data
    const { name, phone, street, district, province, paymentMethod, note, useLoyaltyPoints } = req.body;
    
    // Check if user exists or create a new user if guest checkout
    let user = req.user;
    
    if (!user) {
      const { email, password } = req.body;
      
      // Check if email is provided for guest checkout
      if (!email) {
        req.flash('error', 'Email là bắt buộc.');
        return res.redirect('/orders/checkout');
      }
      
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('error', 'Email đã tồn tại, vui lòng đăng nhập.');
        return res.redirect('/auth/login?returnTo=/orders/checkout');
      }
      
      // Create a new user (guest account)
      user = new User({
        name,
        email,
        password: password ? await bcrypt.hash(password, 12) : undefined,
        phone,
        addresses: [{
          street,
          district,
          province,
          default: true
        }]
      });
      
      await user.save();
    }
    
    // Get cart
    let cart = await Cart.findOne({ 
      $or: [
        { user: user._id },
        { sessionId: req.session.cartId }
      ]
    }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng trống không thể thanh toán.');
      return res.redirect('/cart');
    }
    
    // Check if all products are in stock
    for (const item of cart.items) {
      if (!item.product) {
        req.flash('error', 'Một số sản phẩm trong giỏ hàng không còn tồn tại.');
        return res.redirect('/cart');
      }
      
      if (item.variant && item.variant.name && item.variant.value) {
        const variant = item.product.variants.find(v => v.name === item.variant.name);
        if (!variant) {
          req.flash('error', `Biến thể ${item.variant.name} của sản phẩm ${item.product.name} không còn tồn tại.`);
          return res.redirect('/cart');
        }
        
        const option = variant.options.find(o => o.value === item.variant.value);
        if (!option || option.stock < item.quantity) {
          req.flash('error', `Biến thể ${item.variant.value} của sản phẩm ${item.product.name} không đủ hàng.`);
          return res.redirect('/cart');
        }
      } else if (item.product.stock < item.quantity) {
        req.flash('error', `Sản phẩm ${item.product.name} không đủ hàng.`);
        return res.redirect('/cart');
      }
    }
    
    // Calculate total amount
    let totalAmount = cart.calculateTotalWithDiscount();
    let loyaltyPointsUsed = 0;
    
    // Apply loyalty points if requested
    if (useLoyaltyPoints && user.loyaltyPoints > 0) {
      const maxPointsValue = totalAmount;
      const pointsValue = Math.min(user.loyaltyPoints * 1000, maxPointsValue);
      
      totalAmount -= pointsValue;
      loyaltyPointsUsed = Math.floor(pointsValue / 1000);
    }
    
    // Determine payment status based on payment method
    let paymentStatus = 'pending';
    let paymentDetails = null;
    
    if (paymentMethod === 'credit_card') {
      // Store partial card info for reference
      const { card_number, card_name, card_expiry } = req.body;
      
      if (card_number && card_name && card_expiry) {
        const last4Digits = card_number.replace(/\s/g, '').slice(-4);
        
        paymentDetails = {
          cardType: getCardType(card_number),
          cardLast4: last4Digits,
          cardHolder: card_name.toUpperCase(),
          cardExpiry: card_expiry
        };
        
        // In a real production app, we would process the payment with a payment gateway
        // and set paymentStatus based on the result
        paymentStatus = 'paid';
      }
    } else if (paymentMethod === 'bank_transfer') {
      paymentStatus = 'pending';
      paymentDetails = {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'Source Computer',
        referenceCode: `ORDER-${Date.now()}`
      };
    }
    
    // Create order
    const order = new Order({
      user: user._id,
      items: cart.items.map(item => {
        const orderItem = {
          product: item.product._id,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity
        };
        
        // Only add variant if it exists and has both name and value
        if (item.variant && item.variant.name && item.variant.value) {
          orderItem.variant = {
            name: item.variant.name,
            value: item.variant.value
          };
        }
        
        return orderItem;
      }),
      totalAmount: totalAmount || 0, // Ensure totalAmount is never NaN
      shippingAddress: {
        name,
        street,
        district,
        province,
        phone
      },
      paymentMethod,
      paymentStatus,
      paymentDetails,
      status: 'processing',
      statusHistory: [{
        status: 'processing',
        date: Date.now(),
        note: 'Đơn hàng đã được tạo'
      }],
      couponCode: cart.coupon ? cart.coupon.code : null,
      discount: cart.coupon ? cart.coupon.discount : 0,
      loyaltyPointsUsed: loyaltyPointsUsed || 0,
      loyaltyPointsEarned: totalAmount ? Math.floor(totalAmount * 0.1 / 1000) : 0, // Prevent NaN
      note
    });
    
    await order.save();
    
    // Update product stock and sold count
    for (const item of cart.items) {
      if (item.variant) {
        // Update variant stock
        await Product.updateOne(
          { _id: item.product._id, 'variants.name': item.variant.name, 'variants.options.value': item.variant.value },
          {
            $inc: {
              'variants.$[v].options.$[o].stock': -item.quantity,
              sold: item.quantity
            }
          },
          {
            arrayFilters: [
              { 'v.name': item.variant.name },
              { 'o.value': item.variant.value }
            ]
          }
        );
      } else {
        // Update product stock
        await Product.updateOne(
          { _id: item.product._id },
          {
            $inc: {
              stock: -item.quantity,
              sold: item.quantity
            }
          }
        );
      }
    }
    
    // Update coupon usage if applied
    if (cart.coupon && cart.coupon.code) {
      await Coupon.updateOne(
        { code: cart.coupon.code },
        { $inc: { usedCount: 1 } }
      );
    }
    
    // Update user's loyalty points
    await User.updateOne(
      { _id: user._id },
      {
        $inc: {
          loyaltyPoints: order.loyaltyPointsEarned - loyaltyPointsUsed
        }
      }
    );
    
    // Clear cart
    await Cart.deleteOne({ _id: cart._id });
    if (req.session.cartId) {
      delete req.session.cartId;
    }
    
    req.flash('success', `Đơn hàng #${order.orderNumber} đã được tạo thành công.`);
    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tạo đơn hàng.');
    res.redirect('/orders/checkout');
  }
};

// Helper function to determine card type based on card number
function getCardType(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4\d{12}(?:\d{3})?$/.test(number)) {
    return 'Visa';
  } else if (/^5[1-5]\d{14}$/.test(number)) {
    return 'MasterCard';
  } else if (/^3[47]\d{13}$/.test(number)) {
    return 'American Express';
  } else if (/^6(?:011|5\d{2})\d{12}$/.test(number)) {
    return 'Discover';
  } else {
    return 'Unknown';
  }
}

exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate({
        path: 'items.product',
        select: 'name images slug'
      })
      .populate('user', 'name email');
    
    if (!order || (req.user && order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      req.flash('error', 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.');
      return res.redirect('/user/orders');
    }
    
    res.render('orders/detail', {
      title: `Đơn hàng #${order.orderNumber}`,
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải chi tiết đơn hàng.');
    res.redirect('/user/orders');
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.render('orders/list', {
      title: 'Đơn hàng của tôi',
      orders
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách đơn hàng.');
    res.redirect('/user/profile');
  }
};

// Trang thanh toán cho đơn hàng đã tạo
exports.getPaymentPage = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Tìm đơn hàng
    const order = await Order.findById(orderId);
    
    if (!order || order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.');
      return res.redirect('/user/orders');
    }
    
    // Kiểm tra nếu đơn hàng đã thanh toán hoặc đã bị hủy
    if (order.paymentStatus === 'paid' || order.status === 'cancelled') {
      req.flash('error', 'Đơn hàng này không thể thanh toán.');
      return res.redirect(`/orders/${orderId}`);
    }
    
    res.render('orders/payment', {
      title: 'Thanh toán đơn hàng',
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang thanh toán.');
    res.redirect('/user/orders');
  }
};

// Xử lý thanh toán cho đơn hàng đã tạo
exports.processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;
    
    // Tìm đơn hàng
    const order = await Order.findById(orderId);
    
    if (!order || order.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.');
      return res.redirect('/user/orders');
    }
    
    // Kiểm tra nếu đơn hàng đã thanh toán hoặc đã bị hủy
    if (order.paymentStatus === 'paid' || order.status === 'cancelled') {
      req.flash('error', 'Đơn hàng này không thể thanh toán.');
      return res.redirect(`/orders/${orderId}`);
    }
    
    // Cập nhật phương thức thanh toán
    order.paymentMethod = paymentMethod;
    
    // Xác định trạng thái thanh toán và chi tiết
    let paymentStatus = 'pending';
    let paymentDetails = null;
    
    if (paymentMethod === 'credit_card') {
      // Lưu thông tin thẻ một phần để tham chiếu
      const { card_number, card_name, card_expiry } = req.body;
      
      if (card_number && card_name && card_expiry) {
        const last4Digits = card_number.replace(/\s/g, '').slice(-4);
        
        paymentDetails = {
          cardType: getCardType(card_number),
          cardLast4: last4Digits,
          cardHolder: card_name.toUpperCase(),
          cardExpiry: card_expiry,
          transactionDate: new Date()
        };
        
        // Trong ứng dụng thực tế, chúng ta sẽ xử lý thanh toán với cổng thanh toán
        // và đặt paymentStatus dựa trên kết quả
        paymentStatus = 'paid';
      }
    } else if (paymentMethod === 'bank_transfer') {
      paymentStatus = 'pending';
      paymentDetails = {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'Source Computer',
        referenceCode: `ORDER-${Date.now()}`,
        transactionDate: new Date()
      };
    }
    
    // Cập nhật trạng thái và chi tiết thanh toán
    order.paymentStatus = paymentStatus;
    order.paymentDetails = paymentDetails;
    
    // Thêm ghi chú vào lịch sử trạng thái
    order.statusHistory.push({
      status: order.status,
      date: Date.now(),
      note: `Cập nhật phương thức thanh toán: ${
        paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
        paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
        'Thẻ tín dụng / Thẻ ghi nợ'
      }`
    });
    
    await order.save();
    
    if (paymentStatus === 'paid') {
      req.flash('success', 'Thanh toán thành công.');
    } else {
      req.flash('success', 'Thông tin thanh toán đã được cập nhật.');
    }
    
    res.redirect(`/orders/${orderId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi xử lý thanh toán.');
    res.redirect(`/orders/${req.params.orderId}`);
  }
};
