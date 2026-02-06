const Order = require('../models/Order');
const Cart = require('../models/cart');
const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const emailService = require('../utils/emailService');
const vatCalculator = require('../utils/vatCalculator');
const invoiceGenerator = require('../utils/invoiceGenerator');

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
      req.flash('error', 'Không tìm thấy đơn hàng.');
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
    }

    // Validate stock availability
    for (const item of cart.items) {
      if (!item.product) continue;
      const product = item.product;

      if (item.variants && Object.keys(item.variants).length > 0) {
        for (const [key, value] of Object.entries(item.variants)) {
          const variant = product.variants.find(v => v.name === key);
          if (variant) {
            const option = variant.options.find(o => o.value === value);
            if (option && item.quantity > option.stock) {
              req.flash('error', `Sản phẩm "${product.name}" (${key}: ${value}) không đủ hàng.`);
              return res.redirect('/cart');
            }
          }
        }
      } else {
        if (item.quantity > product.stock) {
          req.flash('error', `Sản phẩm "${product.name}" không đủ hàng.`);
          return res.redirect('/cart');
        }
      }
    }

    // Tính tổng tiền (có tính đến coupon nếu được áp dụng)
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
      }
    }
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

exports.getCheckout = async (req, res) => {
  // Check authentication first
  if (!req.user) {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục.');
    return res.redirect('/auth/login');
  }

  try {
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

    res.render('orders/checkout', {
      title: 'Thanh toán',
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

/**
 * Guest Checkout - GET
 * Hiển thị form checkout cho khách không đăng nhập
 */
exports.getGuestCheckout = async (req, res) => {
  try {
    // Kiểm tra guest cart từ session
    if (!req.session.guestCart || req.session.guestCart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }

    const guestCart = req.session.guestCart;

    // Validate cart items (kiểm tra stock, giá)
    if (req.guestCart) {
      const { errors, validItems } = await req.guestCart.validate();
      if (errors.length > 0) {
        req.flash('warning', errors.map(e => e.message).join('. '));
      }
    }

    // Tính tổng tiền
    const subtotal = guestCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal >= 500000 ? 0 : 30000; // Free ship từ 500k
    const totalAmount = subtotal + shippingCost;

    res.render('orders/guest-checkout', {
      title: 'Thanh toán - Khách',
      cart: guestCart,
      subtotal,
      shippingCost,
      totalAmount,
      vatRate: vatCalculator.VAT_RATE,
      vatInfo: vatCalculator.calculateVatFromInclusivePrice(totalAmount)
    });
  } catch (err) {
    console.error('Lỗi khi tải trang guest checkout:', err);
    res.status(500).send('Đã xảy ra lỗi.');
  }
};

/**
 * Guest Checkout - POST
 * Xử lý đặt hàng cho khách không đăng nhập
 */
exports.postGuestCheckout = async (req, res) => {
  try {
    // Support both test payloads and form payloads
    let guestName = req.body.guestName || (req.body.shippingAddress && req.body.shippingAddress.fullName) || req.body.name;
    let guestEmail = req.body.guestEmail || req.body.email;
    let guestPhone = req.body.guestPhone || req.body.phone || (req.body.shippingAddress && req.body.shippingAddress.phone);
    let address = req.body.address || (req.body.shippingAddress && req.body.shippingAddress.address) || (req.body.shippingAddress && req.body.shippingAddress.street);
    let district = req.body.district || (req.body.shippingAddress && req.body.shippingAddress.district);
    let province = req.body.province || (req.body.shippingAddress && (req.body.shippingAddress.city || req.body.shippingAddress.province));
    let ward = req.body.ward || (req.body.shippingAddress && req.body.shippingAddress.ward);
    const { paymentMethod, note, vatInvoice, vatCompanyName, vatTaxCode, vatAddress, vatEmail } = req.body;

    // Validate required fields (accept both shapes)
    if (!guestName || !guestEmail || !guestPhone || !address || !district || !province) {
      // Try to fallback to session-backed cart presence check and give a generic error
      req.flash('error', 'Vui lòng điền đầy đủ thông tin.');
      return res.redirect('/orders/guest-checkout');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      req.flash('error', 'Email không hợp lệ.');
      return res.redirect('/orders/guest-checkout');
    }

    // Support two storage methods for guest cart used by tests:
    // 1) Session-stored object at req.session.guestCart
    // 2) DB-backed Cart with sessionId stored and session.cartId provided
    let guestCart = null;
    if (req.session && req.session.guestCart && Array.isArray(req.session.guestCart.items) && req.session.guestCart.items.length > 0) {
      guestCart = req.session.guestCart;
    } else if (req.session && req.session.cartId) {
      guestCart = await Cart.findOne({ sessionId: req.session.cartId });
      if (guestCart && guestCart.items) {
        // Normalize structure to match session guestCart shape
        guestCart = {
          items: guestCart.items.map(i => ({ product: i.product.toString ? i.product.toString() : i.product, quantity: i.quantity, price: i.price, variant: i.variant }))
        };
      }
    }

    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      req.flash('error', 'Giỏ hàng của bạn đang trống.');
      return res.redirect('/cart');
    }

    // Validate và update cart items
    const orderItems = [];
    for (const item of guestCart.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // Kiểm tra stock
      let availableStock = product.stock;
      if (item.variant && product.variants) {
        const variant = product.variants.find(v =>
          v.name === item.variant.name && v.value === item.variant.value
        );
        if (variant) availableStock = variant.stock;
      }

      if (item.quantity > availableStock) {
        req.flash('error', `Sản phẩm "${product.name}" không đủ số lượng trong kho.`);
        return res.redirect('/orders/guest-checkout');
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price,
        variants: item.variant ? { [item.variant.name]: item.variant.value } : {}
      });
    }

    // Tính tổng tiền
    const subtotal = guestCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal >= 500000 ? 0 : 30000;
    const totalAmount = subtotal + shippingCost;

    // Generate guest token
    const guestToken = Order.generateGuestToken();

    // Tạo order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Validate VAT info nếu cần
    let vatInfoData = null;
    if (vatInvoice === 'on' || vatInvoice === true) {
      const vatValidation = vatCalculator.validateVatInfo({
        companyName: vatCompanyName,
        taxCode: vatTaxCode,
        address: vatAddress,
        email: vatEmail
      });

      if (!vatValidation.isValid) {
        req.flash('error', vatValidation.errors.join('. '));
        return res.redirect('/orders/guest-checkout');
      }

      vatInfoData = {
        companyName: vatCompanyName,
        taxCode: vatTaxCode,
        address: vatAddress,
        email: vatEmail
      };
    }

    // Tạo đơn hàng
    const order = new Order({
      orderNumber,
      user: null, // Guest order không có user
      isGuestOrder: true,
      guestInfo: {
        name: guestName,
        email: guestEmail.toLowerCase(),
        phone: guestPhone,
        guestToken
      },
      items: orderItems,
      totalAmount,
      shippingCost,
      shippingAddress: {
        name: guestName,
        street: address,
        ward: ward || '',
        district,
        province,
        phone: guestPhone
      },
      paymentDetails: { method: paymentMethod || 'cod' },
      status: 'pending',
      statusHistory: [{ status: 'pending', date: Date.now(), note: 'Đơn hàng đã được tạo (Guest)' }],
      note,
      vatInvoice: vatInvoice === 'on' || vatInvoice === true,
      vatInfo: vatInfoData,
      invoiceNumber: vatInfoData ? vatCalculator.generateInvoiceNumber() : null
    });

    // Bỏ required user validation cho guest order
    order.$locals = { skipUserValidation: true };

    await order.save();

    // Cập nhật tồn kho
    for (const item of guestCart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.variant) {
          product.updateStock(item.quantity, true, item.variant.name, item.variant.value);
        } else {
          product.updateStock(item.quantity);
        }
        await product.save();
      }
    }

    // Xóa guest cart
    delete req.session.guestCart;

    // Gửi email xác nhận
    try {
      const populatedOrder = await Order.findById(order._id).populate('items.product');
      await emailService.sendOrderConfirmationEmail(guestEmail, populatedOrder, guestToken);
      console.log(`Guest order confirmation email sent to ${guestEmail}`);
    } catch (emailError) {
      console.error('Error sending guest order email:', emailError);
    }

    // Redirect đến trang success với guest token
    res.redirect(`/orders/guest-success/${order._id}?token=${guestToken}`);
  } catch (err) {
    console.error('Lỗi khi xử lý guest checkout:', err);
    req.flash('error', 'Đã xảy ra lỗi khi xử lý đơn hàng.');
    res.redirect('/orders/guest-checkout');
  }
};

/**
 * Guest Order Success
 */
exports.getGuestSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query;

    const order = await Order.findById(orderId).populate('items.product');

    if (!order || !order.isGuestOrder || order.guestInfo.guestToken !== token) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/');
    }

    res.render('orders/success', {
      title: 'Đặt hàng thành công',
      order,
      isGuest: true,
      guestToken: token
    });
  } catch (err) {
    console.error('Error loading guest success page:', err);
    res.redirect('/');
  }
};

/**
 * Track Guest Order
 */
exports.trackGuestOrder = async (req, res) => {
  try {
    const { token } = req.params;

    const order = await Order.findByGuestToken(token);

    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng với mã theo dõi này.');
      return res.redirect('/orders/track');
    }

    res.render('orders/track', {
      title: `Theo dõi đơn hàng #${order.orderNumber}`,
      order,
      isGuest: true
    });
  } catch (err) {
    console.error('Error tracking guest order:', err);
    req.flash('error', 'Đã xảy ra lỗi.');
    res.redirect('/');
  }
};

/**
 * One-Click Checkout - POST
 * Đặt hàng nhanh với địa chỉ mặc định
 */
exports.oneClickCheckout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }

    const { paymentMethod, vatInvoice, vatInfo } = req.body;

    // Lấy giỏ hàng
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    // Lấy địa chỉ mặc định
    const user = await User.findById(req.user._id);
    const defaultAddress = user.addresses?.find(addr => addr.default === true);

    if (!defaultAddress) {
      req.flash('error', 'Bạn chưa có địa chỉ mặc định. Vui lòng thêm địa chỉ trong trang cá nhân.');
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa có địa chỉ mặc định. Vui lòng thêm địa chỉ trong trang cá nhân.'
      });
    }

    // Tính tổng tiền
    let totalAmount = cart.coupon ? cart.calculateTotalWithDiscount() : cart.calculateTotal();

    // Auto-apply loyalty points
    let loyaltyPointsUsed = 0;
    if (user.loyaltyPoints > 0) {
      const maxPointsForOrder = Math.floor(totalAmount / 1000);
      loyaltyPointsUsed = Math.min(user.loyaltyPoints, maxPointsForOrder);

      if (loyaltyPointsUsed > 0) {
        const loyaltyDiscount = loyaltyPointsUsed * 1000;
        totalAmount = Math.max(0, totalAmount - loyaltyDiscount);
        user.loyaltyPoints -= loyaltyPointsUsed;
        await user.save();
      }
    }

    const loyaltyPointsEarned = Math.floor(totalAmount * 0.0001);

    // Tạo order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // VAT validation
    let vatInfoData = null;
    if (vatInvoice && vatInfo) {
      const vatValidation = vatCalculator.validateVatInfo(vatInfo);
      if (!vatValidation.isValid) {
        return res.status(400).json({ success: false, message: vatValidation.errors.join('. ') });
      }
      vatInfoData = vatInfo;
    }

    const order = new Order({
      orderNumber,
      user: user._id,
      items: cart.items,
      totalAmount,
      shippingAddress: {
        name: defaultAddress.fullName || user.name,
        street: defaultAddress.street,
        ward: defaultAddress.ward || '',
        district: defaultAddress.district,
        province: defaultAddress.city || defaultAddress.province,
        phone: defaultAddress.phone || user.phone
      },
      paymentDetails: { method: paymentMethod || 'cod' },
      status: 'pending',
      statusHistory: [{ status: 'pending', date: Date.now(), note: 'Đơn hàng One-click checkout' }],
      loyaltyPointsUsed,
      loyaltyPointsEarned,
      usedDefaultAddress: true,
      vatInvoice: !!vatInvoice,
      vatInfo: vatInfoData,
      invoiceNumber: vatInfoData ? vatCalculator.generateInvoiceNumber() : null
    });

    // Coupon
    if (cart.coupon && cart.coupon.code) {
      order.couponCode = cart.coupon.code;
      order.discount = cart.coupon.discount;

      const Coupon = require('../models/coupon');
      await Coupon.findOneAndUpdate(
        { code: cart.coupon.code },
        { $inc: { usedCount: 1 } }
      );
    }

    await order.save();

    // Update stock
    for (const item of cart.items) {
      const product = item.product;
      if (product) {
        if (item.variants && Object.keys(item.variants).length > 0) {
          for (const [variantName, variantValue] of Object.entries(item.variants)) {
            product.updateStock(item.quantity, true, variantName, variantValue);
          }
        } else {
          product.updateStock(item.quantity);
        }
        await product.save();
      }
    }

    // Clear cart
    cart.items = [];
    cart.coupon = null;
    await cart.save();

    // Send email
    try {
      const populatedOrder = await Order.findById(order._id).populate('items.product');
      await emailService.sendOrderConfirmationEmail(user.email, populatedOrder);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.json({
      success: true,
      message: 'Đặt hàng thành công!',
      orderId: order._id,
      orderNumber: order.orderNumber,
      redirectUrl: `/orders/success/${order._id}`
    });
  } catch (err) {
    console.error('One-click checkout error:', err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

/**
 * Get Invoice - HTML view
 */
exports.getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query; // For guest orders

    let order;

    if (token) {
      // Guest order
      order = await Order.findById(orderId).populate('items.product').populate('user');
      if (!order || !order.isGuestOrder || order.guestInfo.guestToken !== token) {
        req.flash('error', 'Không tìm thấy đơn hàng.');
        return res.redirect('/');
      }
    } else {
      // Logged in user
      if (!req.user) {
        req.flash('error', 'Vui lòng đăng nhập.');
        return res.redirect('/auth/login');
      }

      order = await Order.findById(orderId).populate('items.product').populate('user');

      if (!order || (order.user && order.user._id.toString() !== req.user._id.toString())) {
        req.flash('error', 'Không tìm thấy đơn hàng.');
        return res.redirect('/orders/history');
      }
    }

    // Generate invoice HTML
    const invoiceHTML = invoiceGenerator.generateInvoiceHTML(order);

    res.send(invoiceHTML);
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).send('Đã xảy ra lỗi khi tạo hóa đơn.');
  }
};

/**
 * Download Invoice PDF
 */
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query;

    let order;

    if (token) {
      order = await Order.findById(orderId).populate('items.product').populate('user');
      if (!order || !order.isGuestOrder || order.guestInfo.guestToken !== token) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }
    } else {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      }

      order = await Order.findById(orderId).populate('items.product').populate('user');

      if (!order || (order.user && order.user._id.toString() !== req.user._id.toString())) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }
    }

    // Generate PDF
    const pdfBuffer = await invoiceGenerator.generateInvoicePDF(order);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF invoice:', err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tạo PDF' });
  }
};

/**
 * Request VAT Invoice
 * Cho phép user yêu cầu xuất hóa đơn VAT sau khi đã đặt hàng
 */
exports.requestVatInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { companyName, taxCode, address, email } = req.body;

    // Validate VAT info
    const vatValidation = vatCalculator.validateVatInfo({ companyName, taxCode, address, email });
    if (!vatValidation.isValid) {
      return res.status(400).json({ success: false, message: vatValidation.errors.join('. ') });
    }

    // Check minimum amount
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Authorization check
    if (req.user && order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    if (!vatCalculator.isEligibleForVatInvoice(order.totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng phải có giá trị tối thiểu 200,000đ để xuất hóa đơn VAT'
      });
    }

    // Update order
    order.vatInvoice = true;
    order.vatInfo = { companyName, taxCode, address, email };
    order.invoiceNumber = vatCalculator.generateInvoiceNumber();
    order.invoiceGeneratedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Yêu cầu xuất hóa đơn VAT đã được ghi nhận',
      invoiceNumber: order.invoiceNumber
    });
  } catch (err) {
    console.error('Error requesting VAT invoice:', err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

/**
 * Calculate VAT Preview
 * API để preview VAT breakdown trước khi checkout
 */
exports.calculateVatPreview = async (req, res) => {
  try {
    const { subtotal, shippingCost = 0, discount = 0, total } = req.body;

    // Validate total amount
    const totalAmount = total !== undefined ? total : subtotal;
    if (totalAmount <= 0 || isNaN(totalAmount)) {
      return res.json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const mockOrder = {
      items: [{ price: subtotal, quantity: 1 }],
      shippingCost,
      discount
    };

    const vatData = vatCalculator.calculateOrderVat(mockOrder);

    res.json({
      success: true,
      vat: vatData
    });
  } catch (err) {
    console.error('Error calculating VAT preview:', err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

/**
 * Get User Addresses for Autofill
 */
exports.getUserAddresses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }

    const user = await User.findById(req.user._id).select('addresses name phone');

    res.json({
      success: true,
      addresses: user.addresses || [],
      defaultName: user.name,
      defaultPhone: user.phone
    });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};