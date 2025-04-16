const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const Coupon = require('../models/coupon');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

exports.getDashboard = async (req, res) => {
  try {
    // Get time range filter
    const range = req.query.range || 'month'; // Default is month
    let startDate, endDate;
    
    // Calculate date range based on filter
    const now = new Date();
    switch(range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // Get first day of current week (Sunday as first day)
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 0);
        break;
      case 'custom':
        if (req.query.startDate && req.query.endDate) {
          startDate = new Date(req.query.startDate);
          endDate = new Date(req.query.endDate);
          endDate.setDate(endDate.getDate() + 1); // Include the end date
        } else {
          // Default to current month if custom range is invalid
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Get orders within the selected date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $ne: 'cancelled' }
    });
    
    const totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);
    const totalOrders = orders.length;
    
    // Get pending orders within date range
    const pendingOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      status: 'processing'
    });
    
    // Get total users
    const totalUsers = await User.countDocuments({
      createdAt: { $lt: endDate }
    });
    
    // Get new users within date range
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    
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
    
    // Get best selling products within date range
    const bestSellers = await Product.find()
      .sort({ sold: -1 })
      .limit(5);
    
    // Prepare data for charts based on the selected range
    let timeLabels = [];
    let revenueData = [];
    let ordersData = [];
    
    // Generate time-based labels and data depending on the range
    if (range === 'week') {
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      timeLabels = dayNames;
      
      // Initialize data arrays with zeros
      revenueData = Array(7).fill(0);
      ordersData = Array(7).fill(0);
      
      // Collect data for each day of the week
      orders.forEach(order => {
        const dayIndex = new Date(order.createdAt).getDay();
        revenueData[dayIndex] += order.totalAmount;
        ordersData[dayIndex]++;
      });
    } else if (range === 'month' || range === 'custom' && 
              (endDate - startDate) / (1000 * 60 * 60 * 24) <= 31) {
      // Daily data for month or custom range less than a month
      const daysInMonth = (endDate - startDate) / (1000 * 60 * 60 * 24);
      
      // Create array of day labels
      for (let i = 0; i < daysInMonth; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        timeLabels.push(day.getDate().toString());
        revenueData[i] = 0;
        ordersData[i] = 0;
      }
      
      // Collect data for each day
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayDiff = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff >= 0 && dayDiff < daysInMonth) {
          revenueData[dayDiff] += order.totalAmount;
          ordersData[dayDiff]++;
        }
      });
    } else if (range === 'quarter' || (range === 'custom' && 
              (endDate - startDate) / (1000 * 60 * 60 * 24) <= 120)) {
      // Weekly data for quarter or custom range less than 4 months
      timeLabels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 
                   'Tuần 6', 'Tuần 7', 'Tuần 8', 'Tuần 9', 'Tuần 10', 
                   'Tuần 11', 'Tuần 12', 'Tuần 13'];
      
      // Initialize data arrays
      revenueData = Array(13).fill(0);
      ordersData = Array(13).fill(0);
      
      // Collect data by week
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const weekNumber = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        
        if (weekNumber >= 0 && weekNumber < 13) {
          revenueData[weekNumber] += order.totalAmount;
          ordersData[weekNumber]++;
        }
      });
    } else if (range === 'year' || range === 'custom') {
      // Monthly data for year or longer custom range
      const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 
                         'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 
                         'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
      
      timeLabels = monthNames;
      
      // Initialize data arrays
      revenueData = Array(12).fill(0);
      ordersData = Array(12).fill(0);
      
      // Collect data by month
      orders.forEach(order => {
        const month = new Date(order.createdAt).getMonth();
        revenueData[month] += order.totalAmount;
        ordersData[month]++;
      });
    }
    
    // Get category statistics for pie chart
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    const categoryLabels = categories.map(c => c._id);
    const categoryData = categories.map(c => c.count);
    
    // Tính lợi nhuận - ước tính lợi nhuận khoảng 30% doanh thu
    const totalProfit = Math.round(totalRevenue * 0.3);
    const profitData = revenueData.map(revenue => Math.round(revenue * 0.3));
    
    // Dữ liệu cho biểu đồ phân tích so sánh
    // So sánh doanh thu theo thời gian (năm, quý, tháng, tuần)
    const currentYear = new Date().getFullYear();
    const comparisonLabels = [currentYear - 2, currentYear - 1, currentYear].map(year => year.toString());
    
    // Lấy dữ liệu doanh thu theo năm
    const yearlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: new Date(currentYear - 2, 0, 1) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1 } }
    ]);
    
    // Chuẩn bị dữ liệu so sánh
    const comparisonData = yearlyRevenue.map(item => item.totalRevenue || 0);
    
    // Lấy dữ liệu sản phẩm theo danh mục chi tiết
    const productsByCategoryDetailed = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          sold: { $sum: '$sold' }
        }
      },
      { $sort: { sold: -1 } }
    ]);
    
    const productsByCategoryLabels = productsByCategoryDetailed.map(c => c._id);
    const productsByCategoryData = productsByCategoryDetailed.map(c => c.sold || 0);
    
    // Lấy dữ liệu sản phẩm theo thương hiệu
    const brandAnalysis = await Product.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          sold: { $sum: '$sold' }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);
    
    const brandLabels = brandAnalysis.map(b => b._id);
    const brandData = brandAnalysis.map(b => b.sold || 0);
    
    res.render('admin/dashboard', {
      title: 'Quản trị',
      totalRevenue,
      totalOrders,
      totalProfit,
      pendingOrders,
      totalUsers,
      newUsers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      bestSellers,
      timeLabels: JSON.stringify(timeLabels),
      revenueData: JSON.stringify(revenueData),
      ordersData: JSON.stringify(ordersData),
      profitData: JSON.stringify(profitData),
      categoryLabels: JSON.stringify(categoryLabels),
      categoryData: JSON.stringify(categoryData),
      comparisonLabels: JSON.stringify(comparisonLabels),
      comparisonData: JSON.stringify(comparisonData),
      productsByCategoryLabels: JSON.stringify(productsByCategoryLabels),
      productsByCategoryData: JSON.stringify(productsByCategoryData),
      brandLabels: JSON.stringify(brandLabels),
      brandData: JSON.stringify(brandData),
      currentRange: range,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date(endDate.getTime() - 86400000).toISOString().split('T')[0], // Subtract a day for display
      path: '/admin'
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
      filter: req.query,
      path: '/admin/products'
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
      brands,
      path: '/admin/products'
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
      brands,
      path: '/admin/products'
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
    
    // Time range filter
    if (req.query.timeRange) {
      const now = new Date();
      let startDate, endDate;
      
      switch(req.query.timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          // Get first day of current week (Sunday as first day)
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek));
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'custom':
          if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            // Add one day to endDate to include the full day
            endDate = new Date(req.query.endDate);
            endDate.setDate(endDate.getDate() + 1);
          }
          break;
      }
      
      if (startDate && endDate) {
        filter.createdAt = { $gte: startDate, $lt: endDate };
      }
    }
    
    // Get orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
    
    // Get total orders count
    const total = await Order.countDocuments(filter);
    
    // Build filter object to pass to template for maintaining filter state
    const filterObj = {
      search: req.query.search || '',
      status: req.query.status || '',
      timeRange: req.query.timeRange || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    };
    
    res.render('admin/orders/index', {
      title: 'Quản lý đơn hàng',
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      filter: filterObj,
      path: '/admin/orders'
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
      order,
      path: '/admin/orders'
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
      filter: req.query,
      path: '/admin/users'
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
      orders,
      path: '/admin/users'
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
      filter: req.query,
      path: '/admin/coupons'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách mã giảm giá.');
    res.redirect('/admin');
  }
};

exports.getAddCoupon = (req, res) => {
  res.render('admin/coupons/add', {
    title: 'Thêm mã giảm giá mới',
    path: '/admin/coupons'
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
      coupon,
      path: '/admin/coupons'
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
