const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const Coupon = require('../models/coupon');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

exports.getDashboard = async (req, res) => {
  try {
    // Get total revenue
    const orders = await Order.find({
      status: { $ne: 'cancelled' }
    });
    
    const totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);
    
    // Get total orders
    const totalOrders = orders.length;
    
    // Get pending orders
    const pendingOrders = await Order.countDocuments({
      status: 'processing'
    });
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get total products
    const totalProducts = await Product.countDocuments();
    
    // Get low stock products (less than 10)
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 }
    });
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');
    
    // Get best selling products
    const bestSellers = await Product.find()
      .sort({ sold: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      title: 'Quản trị',
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalUsers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      bestSellers
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải bảng điều khiển.');
    res.redirect('/');
  }
};

// Product Management
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Get products
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total products count
    const total = await Product.countDocuments(filter);
    
    // Get categories for filter
    const categories = await Product.distinct('category');
    
    res.render('admin/products/index', {
      title: 'Quản lý sản phẩm',
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      categories,
      filter: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách sản phẩm.');
    res.redirect('/admin');
  }
};

exports.getAddProduct = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.render('admin/products/add', {
      title: 'Thêm sản phẩm mới',
      categories,
      brands
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang thêm sản phẩm.');
    res.redirect('/admin/products');
  }
};

exports.postAddProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      stock,
      specifications,
      variants
    } = req.body;
    
    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    // Check if slug exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      req.flash('error', 'Sản phẩm với tên tương tự đã tồn tại.');
      return res.redirect('/admin/products/add');
    }
    
    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(file.filename);
      });
    }
    
    // Process specifications
    const parsedSpecs = [];
    if (specifications) {
      const specNames = Array.isArray(specifications.name) ? specifications.name : [specifications.name];
      const specValues = Array.isArray(specifications.value) ? specifications.value : [specifications.value];
      
      for (let i = 0; i < specNames.length; i++) {
        if (specNames[i] && specValues[i]) {
          parsedSpecs.push({
            name: specNames[i],
            value: specValues[i]
          });
        }
      }
    }
    
    // Process variants
    const parsedVariants = [];
    if (variants) {
      const variantNames = Array.isArray(variants.name) ? variants.name : [variants.name];
      const variantValues = Array.isArray(variants.value) ? variants.value : [variants.value];
      const additionalPrices = Array.isArray(variants.additionalPrice) 
        ? variants.additionalPrice 
        : [variants.additionalPrice];
      const variantStocks = Array.isArray(variants.stock) ? variants.stock : [variants.stock];
      
      // Group by variant name
      const variantGroups = {};
      
      for (let i = 0; i < variantNames.length; i++) {
        if (variantNames[i] && variantValues[i]) {
          if (!variantGroups[variantNames[i]]) {
            variantGroups[variantNames[i]] = {
              name: variantNames[i],
              options: []
            };
          }
          
          variantGroups[variantNames[i]].options.push({
            value: variantValues[i],
            additionalPrice: additionalPrices[i] ? parseFloat(additionalPrices[i]) : 0,
            stock: variantStocks[i] ? parseInt(variantStocks[i]) : 0
          });
        }
      }
      
      Object.values(variantGroups).forEach(group => {
        parsedVariants.push(group);
      });
    }
    
    // Create product
    const product = new Product({
      name,
      slug,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      category,
      subcategory,
      brand,
      stock: parseInt(stock),
      images,
      specifications: parsedSpecs,
      variants: parsedVariants
    });
    
    await product.save();
    
    req.flash('success', 'Sản phẩm đã được thêm thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thêm sản phẩm.');
    res.redirect('/admin/products/add');
  }
};

exports.getEditProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }
    
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.render('admin/products/edit', {
      title: `Chỉnh sửa: ${product.name}`,
      product,
      categories,
      brands
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thông tin sản phẩm.');
    res.redirect('/admin/products');
  }
};

exports.postUpdateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      stock,
      specifications,
      variants,
      removeImages
    } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }
    
    // Process uploaded images
    const newImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        newImages.push(file.filename);
      });
    }
    
    // Process existing images (remove selected images)
    const existingImages = [...product.images];
    if (removeImages) {
      const imagesToRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
      
      // Delete image files
      imagesToRemove.forEach(img => {
        const imagePath = path.join(__dirname, '../public/uploads/products', img);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
      
      // Filter out removed images
      product.images = existingImages.filter(img => !imagesToRemove.includes(img));
    }
    
    // Add new images
    product.images = [...product.images, ...newImages];
    
    // Process specifications
    const parsedSpecs = [];
    if (specifications) {
      const specNames = Array.isArray(specifications.name) ? specifications.name : [specifications.name];
      const specValues = Array.isArray(specifications.value) ? specifications.value : [specifications.value];
      
      for (let i = 0; i < specNames.length; i++) {
        if (specNames[i] && specValues[i]) {
          parsedSpecs.push({
            name: specNames[i],
            value: specValues[i]
          });
        }
      }
    }
    
    // Process variants
    const parsedVariants = [];
    if (variants) {
      const variantNames = Array.isArray(variants.name) ? variants.name : [variants.name];
      const variantValues = Array.isArray(variants.value) ? variants.value : [variants.value];
      const additionalPrices = Array.isArray(variants.additionalPrice) 
        ? variants.additionalPrice 
        : [variants.additionalPrice];
      const variantStocks = Array.isArray(variants.stock) ? variants.stock : [variants.stock];
      
      // Group by variant name
      const variantGroups = {};
      
      for (let i = 0; i < variantNames.length; i++) {
        if (variantNames[i] && variantValues[i]) {
          if (!variantGroups[variantNames[i]]) {
            variantGroups[variantNames[i]] = {
              name: variantNames[i],
              options: []
            };
          }
          
          variantGroups[variantNames[i]].options.push({
            value: variantValues[i],
            additionalPrice: additionalPrices[i] ? parseFloat(additionalPrices[i]) : 0,
            stock: variantStocks[i] ? parseInt(variantStocks[i]) : 0
          });
        }
      }
      
      Object.values(variantGroups).forEach(group => {
        parsedVariants.push(group);
      });
    }
    
    // Update product
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    product.category = category;
    product.subcategory = subcategory;
    product.brand = brand;
    product.stock = parseInt(stock);
    product.specifications = parsedSpecs;
    product.variants = parsedVariants;
    
    await product.save();
    
    req.flash('success', 'Sản phẩm đã được cập nhật thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật sản phẩm.');
    res.redirect(`/admin/products/edit/${req.params.productId}`);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    
    // Delete product images
    product.images.forEach(img => {
      const imagePath = path.join(__dirname, '../public/uploads/products', img);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });
    
    await Product.deleteOne({ _id: productId });
    
    return res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa thành công.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xóa sản phẩm.' });
  }
};

// Order Management
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      filter.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
    
    // Get total orders count
    const total = await Order.countDocuments(filter);
    
    res.render('admin/orders/index', {
      title: 'Quản lý đơn hàng',
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      filter: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách đơn hàng.');
    res.redirect('/admin');
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
      .populate('user', 'name email phone');
    
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/admin/orders');
    }
    
    res.render('admin/orders/detail', {
      title: `Đơn hàng #${order.orderNumber}`,
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải chi tiết đơn hàng.');
    res.redirect('/admin/orders');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    
    // Update status
    order.status = status;
    
    // Add to status history
    order.statusHistory.push({
      status,
      date: Date.now(),
      note: note || `Trạng thái đơn hàng đã được cập nhật thành ${status}`
    });
    
    await order.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Trạng thái đơn hàng đã được cập nhật.',
      newStatus: status
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.' });
  }
};

// User Management
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get users
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total users count
    const total = await User.countDocuments(filter);
    
    res.render('admin/users/index', {
      title: 'Quản lý người dùng',
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      filter: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách người dùng.');
    res.redirect('/admin');
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'Không tìm thấy người dùng.');
      return res.redirect('/admin/users');
    }
    
    // Get user's orders
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.render('admin/users/detail', {
      title: `Thông tin người dùng: ${user.name}`,
      user,
      orders
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thông tin người dùng.');
    res.redirect('/admin/users');
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }
    
    await User.updateOne(
      { _id: userId },
      { $set: { role } }
    );
    
    return res.status(200).json({ 
      success: true, 
      message: 'Vai trò người dùng đã được cập nhật thành công.',
      newRole: role
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật vai trò người dùng.' });
  }
};

// Coupon Management
exports.getCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    if (req.query.active === 'true') {
      filter.active = true;
    } else if (req.query.active === 'false') {
      filter.active = false;
    }
    
    if (req.query.search) {
      filter.$or = [
        { code: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get coupons
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total coupons count
    const total = await Coupon.countDocuments(filter);
    
    res.render('admin/coupons/index', {
      title: 'Quản lý mã giảm giá',
      coupons,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCoupons: total,
      filter: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách mã giảm giá.');
    res.redirect('/admin');
  }
};

exports.getAddCoupon = (req, res) => {
  res.render('admin/coupons/add', {
    title: 'Thêm mã giảm giá mới'
  });
};

exports.postAddCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount,
      minAmount,
      startDate,
      endDate,
      maxUses,
      active
    } = req.body;
    
    // Check if code exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      req.flash('error', 'Mã giảm giá này đã tồn tại.');
      return res.redirect('/admin/coupons/add');
    }
    
    // Create coupon
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
    
    req.flash('success', 'Mã giảm giá đã được thêm thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thêm mã giảm giá.');
    res.redirect('/admin/coupons/add');
  }
};

exports.getEditCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      req.flash('error', 'Không tìm thấy mã giảm giá.');
      return res.redirect('/admin/coupons');
    }
    
    res.render('admin/coupons/edit', {
      title: `Chỉnh sửa: ${coupon.code}`,
      coupon
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thông tin mã giảm giá.');
    res.redirect('/admin/coupons');
  }
};

exports.postUpdateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const {
      description,
      discount,
      minAmount,
      startDate,
      endDate,
      maxUses,
      active
    } = req.body;
    
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      req.flash('error', 'Không tìm thấy mã giảm giá.');
      return res.redirect('/admin/coupons');
    }
    
    // Update coupon
    coupon.description = description;
    coupon.discount = parseFloat(discount);
    coupon.minAmount = parseFloat(minAmount) || 0;
    coupon.startDate = new Date(startDate);
    coupon.endDate = new Date(endDate);
    coupon.maxUses = maxUses ? parseInt(maxUses) : null;
    coupon.active = active === 'on' || active === true;
    
    await coupon.save();
    
    req.flash('success', 'Mã giảm giá đã được cập nhật thành công.');
    res.redirect('/admin/coupons');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật mã giảm giá.');
    res.redirect(`/admin/coupons/edit/${req.params.couponId}`);
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    await Coupon.findByIdAndDelete(couponId);
    
    return res.status(200).json({ success: true, message: 'Mã giảm giá đã được xóa thành công.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xóa mã giảm giá.' });
  }
};
