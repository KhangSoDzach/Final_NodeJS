const Product = require('../../models/product');
const StockMovement = require('../../models/stockMovement');
const PreOrder = require('../../models/preOrder');
const BackInStockNotification = require('../../models/backInStockNotification');
const { validationResult } = require('express-validator');

/**
 * Inventory Controller - Quản lý kho hàng
 * Bao gồm: Xem tồn kho, nhập/xuất kho, lịch sử, cảnh báo, pre-order, back-in-stock
 */

// ========================= INVENTORY OVERVIEW =========================

/**
 * GET /admin/inventory
 * Trang tổng quan kho hàng
 */
exports.getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filters
    const { search, category, stockStatus, sortBy } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (stockStatus === 'out-of-stock') {
      query.stock = 0;
    } else if (stockStatus === 'low-stock') {
      query.$expr = { $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$lowStockThreshold'] }
      ]};
    } else if (stockStatus === 'in-stock') {
      query.$expr = { $gt: ['$stock', '$lowStockThreshold'] };
    }
    
    // Sort options
    let sort = { updatedAt: -1 };
    if (sortBy === 'stock-asc') sort = { stock: 1 };
    else if (sortBy === 'stock-desc') sort = { stock: -1 };
    else if (sortBy === 'name') sort = { name: 1 };
    else if (sortBy === 'sold') sort = { sold: -1 };
    
    const products = await Product.find(query)
      .select('name sku slug images stock lowStockThreshold sold category brand allowPreOrder estimatedRestockDate variants')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Stats
    const stats = await getInventoryStats();
    
    // Get categories for filter
    const categories = await Product.distinct('category');
    
    res.render('admin/inventory/index', {
      title: 'Quản lý kho hàng',
      products,
      stats,
      categories,
      filters: { search, category, stockStatus, sortBy },
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages
      },
      path: '/admin/inventory'
    });
  } catch (error) {
    console.error('Lỗi getInventory:', error);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang kho hàng');
    res.redirect('/admin');
  }
};

/**
 * Lấy thống kê kho hàng
 */
async function getInventoryStats() {
  const [
    totalProducts,
    outOfStockCount,
    lowStockProducts,
    totalStockValue,
    preOrderCount,
    notificationCount
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ stock: 0 }),
    Product.find({
      $expr: { $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$lowStockThreshold'] }
      ]}
    }).select('name stock lowStockThreshold'),
    Product.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$price'] } } } }
    ]),
    PreOrder.countDocuments({ status: 'pending' }),
    BackInStockNotification.countDocuments({ status: 'active' })
  ]);
  
  return {
    totalProducts,
    outOfStockCount,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 10), // Top 10
    totalStockValue: totalStockValue[0]?.total || 0,
    preOrderCount,
    notificationCount
  };
}

// ========================= STOCK MOVEMENTS =========================

/**
 * GET /admin/inventory/movements
 * Lịch sử nhập/xuất kho
 */
exports.getStockMovements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    
    const { type, productId, startDate, endDate } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (productId) query.product = productId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }
    
    const movements = await StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name sku images')
      .populate('createdBy', 'name email')
      .populate('order', 'orderNumber');
    
    const totalMovements = await StockMovement.countDocuments(query);
    const totalPages = Math.ceil(totalMovements / limit);
    
    // Summary statistics
    const summary = await StockMovement.getSummary(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );
    
    res.render('admin/inventory/movements', {
      title: 'Lịch sử kho hàng',
      movements,
      summary,
      filters: { type, productId, startDate, endDate },
      pagination: {
        page,
        limit,
        totalMovements,
        totalPages
      },
      path: '/admin/inventory/movements'
    });
  } catch (error) {
    console.error('Lỗi getStockMovements:', error);
    req.flash('error', 'Đã xảy ra lỗi khi tải lịch sử kho hàng');
    res.redirect('/admin/inventory');
  }
};

/**
 * GET /admin/inventory/import
 * Trang nhập kho
 */
exports.getImportStock = async (req, res) => {
  try {
    const products = await Product.find()
      .select('name sku stock category brand variants')
      .sort({ name: 1 });
    
    res.render('admin/inventory/import', {
      title: 'Nhập kho',
      products,
      path: '/admin/inventory/import'
    });
  } catch (error) {
    console.error('Lỗi getImportStock:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

/**
 * POST /admin/inventory/import
 * Xử lý nhập kho
 */
exports.postImportStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/admin/inventory/import');
    }
    
    const { 
      productId, 
      variantName, 
      variantValue, 
      quantity, 
      reason,
      supplierName,
      invoiceNumber,
      costPrice,
      notes 
    } = req.body;
    
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      req.flash('error', 'Số lượng phải là số dương');
      return res.redirect('/admin/inventory/import');
    }
    
    const variant = variantName && variantValue ? { name: variantName, value: variantValue } : null;
    
    const result = await StockMovement.createMovement({
      productId,
      variant,
      type: 'import',
      quantity: parsedQuantity,
      reason: reason || 'Nhập kho',
      supplier: supplierName ? {
        name: supplierName,
        invoiceNumber,
        cost: parseFloat(costPrice) || 0
      } : null,
      userId: req.user._id,
      notes
    });
    
    req.flash('success', `Đã nhập ${parsedQuantity} sản phẩm vào kho. Tồn kho mới: ${result.movement.newStock}`);
    res.redirect('/admin/inventory');
  } catch (error) {
    console.error('Lỗi postImportStock:', error);
    req.flash('error', error.message || 'Đã xảy ra lỗi khi nhập kho');
    res.redirect('/admin/inventory/import');
  }
};

/**
 * GET /admin/inventory/export
 * Trang xuất kho
 */
exports.getExportStock = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } })
      .select('name sku stock category brand variants')
      .sort({ name: 1 });
    
    res.render('admin/inventory/export', {
      title: 'Xuất kho',
      products,
      path: '/admin/inventory/export'
    });
  } catch (error) {
    console.error('Lỗi getExportStock:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

/**
 * POST /admin/inventory/export
 * Xử lý xuất kho
 */
exports.postExportStock = async (req, res) => {
  try {
    const { 
      productId, 
      variantName, 
      variantValue, 
      quantity, 
      reason,
      notes 
    } = req.body;
    
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      req.flash('error', 'Số lượng phải là số dương');
      return res.redirect('/admin/inventory/export');
    }
    
    const variant = variantName && variantValue ? { name: variantName, value: variantValue } : null;
    
    const result = await StockMovement.createMovement({
      productId,
      variant,
      type: 'export',
      quantity: -parsedQuantity, // Âm vì xuất kho
      reason: reason || 'Xuất kho',
      userId: req.user._id,
      notes
    });
    
    req.flash('success', `Đã xuất ${parsedQuantity} sản phẩm. Tồn kho còn: ${result.movement.newStock}`);
    res.redirect('/admin/inventory');
  } catch (error) {
    console.error('Lỗi postExportStock:', error);
    req.flash('error', error.message || 'Đã xảy ra lỗi khi xuất kho');
    res.redirect('/admin/inventory/export');
  }
};

/**
 * GET /admin/inventory/adjust/:productId
 * Trang điều chỉnh tồn kho
 */
exports.getAdjustStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      req.flash('error', 'Sản phẩm không tồn tại');
      return res.redirect('/admin/inventory');
    }
    
    // Lấy lịch sử gần đây của sản phẩm
    const recentMovements = await StockMovement.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'name');
    
    res.render('admin/inventory/adjust', {
      title: 'Điều chỉnh tồn kho',
      product,
      recentMovements,
      path: '/admin/inventory/adjust'
    });
  } catch (error) {
    console.error('Lỗi getAdjustStock:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

/**
 * POST /admin/inventory/adjust/:productId
 * Xử lý điều chỉnh tồn kho
 */
exports.postAdjustStock = async (req, res) => {
  try {
    const { variantName, variantValue, newQuantity, reason, notes } = req.body;
    
    const product = await Product.findById(req.params.productId);
    if (!product) {
      req.flash('error', 'Sản phẩm không tồn tại');
      return res.redirect('/admin/inventory');
    }
    
    const parsedNewQuantity = parseInt(newQuantity);
    if (isNaN(parsedNewQuantity) || parsedNewQuantity < 0) {
      req.flash('error', 'Số lượng mới phải là số không âm');
      return res.redirect(`/admin/inventory/adjust/${req.params.productId}`);
    }
    
    let currentStock;
    if (variantName && variantValue) {
      const variant = product.variants.find(v => v.name === variantName);
      const option = variant?.options.find(o => o.value === variantValue);
      currentStock = option?.stock || 0;
    } else {
      currentStock = product.stock;
    }
    
    const quantityChange = parsedNewQuantity - currentStock;
    
    if (quantityChange === 0) {
      req.flash('info', 'Không có thay đổi tồn kho');
      return res.redirect('/admin/inventory');
    }
    
    const variant = variantName && variantValue ? { name: variantName, value: variantValue } : null;
    
    await StockMovement.createMovement({
      productId: req.params.productId,
      variant,
      type: 'adjustment',
      quantity: quantityChange,
      reason: reason || 'Điều chỉnh tồn kho',
      userId: req.user._id,
      notes
    });
    
    req.flash('success', `Đã điều chỉnh tồn kho từ ${currentStock} thành ${parsedNewQuantity}`);
    res.redirect('/admin/inventory');
  } catch (error) {
    console.error('Lỗi postAdjustStock:', error);
    req.flash('error', error.message || 'Đã xảy ra lỗi khi điều chỉnh');
    res.redirect(`/admin/inventory/adjust/${req.params.productId}`);
  }
};

// ========================= LOW STOCK ALERTS =========================

/**
 * GET /admin/inventory/alerts
 * Trang cảnh báo tồn kho
 */
exports.getLowStockAlerts = async (req, res) => {
  try {
    // Sản phẩm hết hàng
    const outOfStockProducts = await Product.find({ stock: 0 })
      .select('name sku images stock category brand allowPreOrder')
      .sort({ updatedAt: -1 });
    
    // Sản phẩm sắp hết hàng
    const lowStockProducts = await Product.find({
      $expr: { $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$lowStockThreshold'] }
      ]}
    })
      .select('name sku images stock lowStockThreshold category brand')
      .sort({ stock: 1 });
    
    // Variants sắp hết
    const productsWithLowVariants = await Product.find({
      'variants.options.stock': { $lte: 10, $gt: 0 }
    }).select('name sku variants');
    
    const lowStockVariants = [];
    productsWithLowVariants.forEach(product => {
      product.variants.forEach(variant => {
        variant.options.forEach(option => {
          if (option.stock <= 10 && option.stock > 0) {
            lowStockVariants.push({
              product: { _id: product._id, name: product.name, sku: product.sku },
              variant: variant.name,
              option: option.value,
              stock: option.stock
            });
          }
        });
      });
    });
    
    // Pre-orders đang chờ
    const pendingPreOrders = await PreOrder.find({ status: 'pending' })
      .populate('product', 'name sku images')
      .populate('user', 'name email')
      .sort({ createdAt: 1 });
    
    res.render('admin/inventory/alerts', {
      title: 'Cảnh báo tồn kho',
      outOfStockProducts,
      lowStockProducts,
      lowStockVariants,
      pendingPreOrders,
      path: '/admin/inventory/alerts'
    });
  } catch (error) {
    console.error('Lỗi getLowStockAlerts:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

/**
 * POST /admin/inventory/threshold/:productId
 * Cập nhật ngưỡng cảnh báo tồn kho
 */
exports.postUpdateThreshold = async (req, res) => {
  try {
    const { lowStockThreshold } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { lowStockThreshold: parseInt(lowStockThreshold) || 10 },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    
    res.json({ success: true, message: 'Đã cập nhật ngưỡng cảnh báo', lowStockThreshold: product.lowStockThreshold });
  } catch (error) {
    console.error('Lỗi postUpdateThreshold:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

// ========================= PRE-ORDERS =========================

/**
 * GET /admin/inventory/pre-orders
 * Quản lý đặt hàng trước
 */
exports.getPreOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, productId } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (productId) query.product = productId;
    
    const preOrders = await PreOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name sku images stock')
      .populate('user', 'name email phone');
    
    const totalPreOrders = await PreOrder.countDocuments(query);
    const totalPages = Math.ceil(totalPreOrders / limit);
    
    // Stats
    const stats = await PreOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.render('admin/inventory/pre-orders', {
      title: 'Quản lý đặt trước',
      preOrders,
      stats: stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      filters: { status, productId },
      pagination: { page, limit, totalPreOrders, totalPages },
      path: '/admin/inventory/pre-orders'
    });
  } catch (error) {
    console.error('Lỗi getPreOrders:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

/**
 * POST /admin/inventory/pre-orders/:id/notify
 * Gửi thông báo có hàng cho pre-order
 */
exports.postNotifyPreOrder = async (req, res) => {
  try {
    const preOrder = await PreOrder.findById(req.params.id)
      .populate('user', 'name email')
      .populate('product', 'name slug images');
    
    if (!preOrder) {
      return res.status(404).json({ success: false, message: 'Pre-order không tồn tại' });
    }
    
    const emailService = require('../../utils/emailService');
    await emailService.sendPreOrderNotification(preOrder);
    
    preOrder.status = 'notified';
    preOrder.notifiedAt = new Date();
    preOrder.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await preOrder.save();
    
    res.json({ success: true, message: 'Đã gửi thông báo thành công' });
  } catch (error) {
    console.error('Lỗi postNotifyPreOrder:', error);
    res.status(500).json({ success: false, message: error.message || 'Đã xảy ra lỗi' });
  }
};

/**
 * POST /admin/inventory/pre-orders/:id/cancel
 * Hủy pre-order
 */
exports.postCancelPreOrder = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    
    const preOrder = await PreOrder.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        adminNotes
      },
      { new: true }
    );
    
    if (!preOrder) {
      return res.status(404).json({ success: false, message: 'Pre-order không tồn tại' });
    }
    
    res.json({ success: true, message: 'Đã hủy pre-order' });
  } catch (error) {
    console.error('Lỗi postCancelPreOrder:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

/**
 * POST /admin/inventory/products/:id/allow-preorder
 * Bật/tắt cho phép đặt trước
 */
exports.postTogglePreOrder = async (req, res) => {
  try {
    const { allowPreOrder, estimatedRestockDate } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        allowPreOrder: allowPreOrder === 'true' || allowPreOrder === true,
        estimatedRestockDate: estimatedRestockDate || null
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    
    res.json({ 
      success: true, 
      message: `Đã ${product.allowPreOrder ? 'bật' : 'tắt'} đặt trước cho sản phẩm`,
      allowPreOrder: product.allowPreOrder
    });
  } catch (error) {
    console.error('Lỗi postTogglePreOrder:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

// ========================= BACK IN STOCK NOTIFICATIONS =========================

/**
 * GET /admin/inventory/notifications
 * Quản lý đăng ký thông báo có hàng
 */
exports.getBackInStockNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    
    const { status, productId } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (productId) query.product = productId;
    
    const notifications = await BackInStockNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name sku images stock')
      .populate('user', 'name email');
    
    const totalNotifications = await BackInStockNotification.countDocuments(query);
    const totalPages = Math.ceil(totalNotifications / limit);
    
    // Stats by product
    const productStats = await BackInStockNotification.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$product', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $project: { 'product.name': 1, 'product.sku': 1, count: 1 } }
    ]);
    
    res.render('admin/inventory/notifications', {
      title: 'Thông báo có hàng',
      notifications,
      productStats,
      filters: { status, productId },
      pagination: { page, limit, totalNotifications, totalPages },
      path: '/admin/inventory/notifications'
    });
  } catch (error) {
    console.error('Lỗi getBackInStockNotifications:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

/**
 * POST /admin/inventory/notifications/send/:productId
 * Gửi thông báo có hàng cho tất cả subscriber của sản phẩm
 */
exports.postSendNotifications = async (req, res) => {
  try {
    const { variant } = req.body;
    
    const result = await BackInStockNotification.notifySubscribers(
      req.params.productId,
      variant ? JSON.parse(variant) : null
    );
    
    res.json({ 
      success: true, 
      message: `Đã gửi ${result.sent} thông báo, ${result.failed} thất bại` 
    });
  } catch (error) {
    console.error('Lỗi postSendNotifications:', error);
    res.status(500).json({ success: false, message: error.message || 'Đã xảy ra lỗi' });
  }
};

// ========================= REPORTS =========================

/**
 * GET /admin/inventory/report
 * Báo cáo tồn kho
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
    
    // Movement summary
    const movementSummary = await StockMovement.getSummary(start, end);
    
    // Top imported products
    const topImported = await StockMovement.aggregate([
      { $match: { type: 'import', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$product', totalImported: { $sum: '$quantity' } } },
      { $sort: { totalImported: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);
    
    // Top sold products
    const topSold = await StockMovement.aggregate([
      { $match: { type: 'order', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$product', totalSold: { $sum: { $abs: '$quantity' } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);
    
    // Daily movements chart data
    const dailyMovements = await StockMovement.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          total: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    res.render('admin/inventory/report', {
      title: 'Báo cáo kho hàng',
      movementSummary,
      topImported,
      topSold,
      dailyMovements,
      filters: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      path: '/admin/inventory/report'
    });
  } catch (error) {
    console.error('Lỗi getInventoryReport:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/admin/inventory');
  }
};

// ========================= API ENDPOINTS =========================

/**
 * GET /api/inventory/product/:productId/history
 * API lấy lịch sử tồn kho của sản phẩm
 */
exports.apiGetProductHistory = async (req, res) => {
  try {
    const result = await StockMovement.getProductHistory(req.params.productId, {
      limit: parseInt(req.query.limit) || 20,
      page: parseInt(req.query.page) || 1,
      type: req.query.type
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Lỗi apiGetProductHistory:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};

/**
 * GET /api/inventory/stats
 * API lấy thống kê nhanh
 */
exports.apiGetStats = async (req, res) => {
  try {
    const stats = await getInventoryStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Lỗi apiGetStats:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
  }
};
