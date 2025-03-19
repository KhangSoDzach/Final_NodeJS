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
      
      if (item.variant) {
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
    const { name, phone, street, city, state, zipCode, paymentMethod, note, useLoyaltyPoints } = req.body;
    
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
          city,
          state,
          zipCode,
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
      
      if (item.variant) {
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
    
    // Create order
    const order = new Order({
      user: user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant
      })),
      totalAmount,
      shippingAddress: {
        name,
        street,
        city,
        state,
        zipCode,
        phone
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: 'processing',
      statusHistory: [{
        status: 'processing',
        date: Date.now(),
        note: 'Đơn hàng đã được tạo'
      }],
      couponCode: cart.coupon ? cart.coupon.code : null,
      discount: cart.coupon ? cart.coupon.discount : 0,
      loyaltyPointsUsed,
      loyaltyPointsEarned: Math.floor(totalAmount * 0.1 / 1000),
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
