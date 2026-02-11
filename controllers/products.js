const Product = require('../models/product');

// Mapping giữa tên danh mục tiếng Anh và tiếng Việt
const categoryMappings = {
  'laptop': 'laptop',
  'pc': 'pc',
  'monitor': 'màn hình',
  'component': 'linh kiện',
  'accessory': 'phụ kiện'
};

// Hàm helper để lấy danh sách tên danh mục tương đương (cả tiếng Anh và tiếng Việt)
function getEquivalentCategories(category) {
  // Tìm tên tiếng Việt nếu đầu vào là tiếng Anh
  const vietnameseName = categoryMappings[category];
  // Tìm tên tiếng Anh nếu đầu vào là tiếng Việt
  const englishName = Object.keys(categoryMappings).find(key => categoryMappings[key] === category);
  
  // Trả về tất cả các tên có thể cho danh mục
  const allNames = [category];
  
  if (vietnameseName && vietnameseName !== category) {
    allNames.push(vietnameseName);
  }
  
  if (englishName && englishName !== category) {
    allNames.push(englishName);
  }
  
  return allNames;
}

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    // Sanitize page number
    if (page < 1) page = 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    // Search query - tìm kiếm trong name, description, brand
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex }
      ];
    }
    
    // Category filter - hỗ trợ cả tên tiếng Anh và tiếng Việt
    if (req.query.category) {
      const equivalentCategories = getEquivalentCategories(req.query.category);
      const regexPattern = equivalentCategories.map(cat => `^${cat}$`).join('|');
      filter.category = { $regex: new RegExp(regexPattern, 'i') };
    }
    
    // Subcategory filter
    if (req.query.subcategory) {
      filter.subcategory = { $regex: new RegExp(`^${req.query.subcategory}$`, 'i') };
    }
    
    // Brand filter (can be multiple)
    if (req.query.brand) {
      if (Array.isArray(req.query.brand)) {
        filter.brand = { $in: req.query.brand.map(brand => new RegExp(`^${brand}$`, 'i')) };
      } else {
        filter.brand = { $regex: new RegExp(`^${req.query.brand}$`, 'i') };
      }
    }
    
    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      // Sử dụng $expr để filter cả price và discountPrice
      const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : 0;
      const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : Number.MAX_SAFE_INTEGER;
      
      filter.$and = filter.$and || [];
      filter.$and.push({
        $expr: {
          $and: [
            { $gte: [{ $ifNull: ['$discountPrice', '$price'] }, minPrice] },
            { $lte: [{ $ifNull: ['$discountPrice', '$price'] }, maxPrice] }
          ]
        }
      });
    }
    
    // Rating filter - Lọc theo đánh giá tối thiểu
    if (req.query.rating) {
      const minRating = parseInt(req.query.rating);
      if (minRating >= 1 && minRating <= 5) {
        // Tính average rating và filter
        filter.$and = filter.$and || [];
        filter.$and.push({
          $expr: {
            $gte: [
              { 
                $cond: {
                  if: { $eq: [{ $size: '$ratings' }, 0] },
                  then: 0,
                  else: { $divide: [{ $sum: '$ratings.rating' }, { $size: '$ratings' }] }
                }
              },
              minRating
            ]
          }
        });
      }
    }
    
    // Stock filter - Lọc theo tình trạng tồn kho
    if (req.query.stock) {
      switch (req.query.stock) {
        case 'in-stock':
          filter.stock = { $gt: 0 };
          break;
        case 'out-of-stock':
          filter.stock = { $lte: 0 };
          filter.allowPreOrder = { $ne: true };
          break;
        case 'pre-order':
          filter.stock = { $lte: 0 };
          filter.allowPreOrder = true;
          break;
      }
    }
    
    // Discount filter - Lọc sản phẩm đang giảm giá
    if (req.query.discount) {
      if (req.query.discount === 'has-discount') {
        filter.discountPrice = { $ne: null, $gt: 0 };
      } else if (req.query.discount === 'no-discount') {
        filter.$or = filter.$or || [];
        filter.$or.push(
          { discountPrice: null },
          { discountPrice: { $exists: false } },
          { discountPrice: 0 }
        );
      }
    }
    
    // Specifications filter - Lọc theo thông số kỹ thuật
    if (req.query.specs) {
      let specs = req.query.specs;
      if (typeof specs === 'string') {
        try {
          specs = JSON.parse(specs);
        } catch (e) {
          specs = {};
        }
      }
      
      // specs format: { "RAM": ["8GB", "16GB"], "CPU": ["Intel Core i5"] }
      Object.keys(specs).forEach(specName => {
        const specValues = Array.isArray(specs[specName]) ? specs[specName] : [specs[specName]];
        if (specValues.length > 0) {
          filter.$and = filter.$and || [];
          filter.$and.push({
            specifications: {
              $elemMatch: {
                name: { $regex: new RegExp(specName, 'i') },
                value: { $in: specValues.map(v => new RegExp(v, 'i')) }
              }
            }
          });
        }
      });
    }
    
    // Sorting
    let sort = { createdAt: -1 }; // Default sort: newest first
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price-asc':
          sort = { price: 1 };
          break;
        case 'price-desc':
          sort = { price: -1 };
          break;
        case 'name-asc':
          sort = { name: 1 };
          break;
        case 'name-desc':
          sort = { name: -1 };
          break;
        case 'rating-desc':
          sort = { averageRating: -1 };
          break;
        case 'bestseller':
          sort = { sold: -1 };
          break;
        case 'discount':
          // Sắp xếp theo % giảm giá
          sort = { discountPercent: -1 };
          break;
      }
    }
    
    // Get products với lean() cho performance
    let query;
    try {
      query = Product.find(filter);
      
      // Check if query is valid (handle mock errors in tests)
      if (!query || typeof query.sort !== 'function') {
        // If it's a promise, handle the rejection to avoid unhandled promise rejection
        if (query && query.catch) {
          query.catch(() => {}); // Consume the rejection
        }
        throw new Error('Database query failed');
      }
    } catch (err) {
      throw err; // Re-throw to be caught by outer catch
    }
    
    const products = await query
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total products count
    const totalProducts = await Product.countDocuments(filter);
    
    // Get all categories, brands and subcategories for filters
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    // Get subcategories based on selected category - hỗ trợ cả tên tiếng Anh và tiếng Việt
    let subcategories = [];
    if (req.query.category) {
      const equivalentCategories = getEquivalentCategories(req.query.category);
      const regexPattern = equivalentCategories.map(cat => `^${cat}$`).join('|');
      subcategories = await Product.distinct('subcategory', { 
        category: { $regex: new RegExp(regexPattern, 'i') } 
      });
    }
    
    // Transform category names to Vietnamese for display
    const displayCategories = categories.map(cat => {
      // Nếu có tên tiếng Việt tương ứng, sử dụng tên tiếng Việt
      const vietnameseName = categoryMappings[cat.toLowerCase()];
      return vietnameseName || cat;
    });
    
    res.render('products/index', {
      title: 'Sản phẩm',
      products,
      filter: req.query,
      categories: displayCategories,
      brands,
      subcategories,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      categoryMappings,
      getPaginationUrl: (page) => {
        const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
        url.searchParams.set('page', page);
        return url.search;
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tải danh sách sản phẩm.' });
  }
};

// Get single product by slug
exports.getProductDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const product = await Product.findOne({ slug })
      .populate({
        path: 'ratings.user',
        select: 'name'
      });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    
    // Get related products - hỗ trợ cả tên tiếng Anh và tiếng Việt
    const equivalentCategories = getEquivalentCategories(product.category);
    const regexPattern = equivalentCategories.map(cat => `^${cat}$`).join('|');
    
    const relatedProducts = await Product.find({
      category: { $regex: new RegExp(regexPattern, 'i') },
      _id: { $ne: product._id }
    }).limit(4);
    
    res.render('products/detail', {
      title: product.name,
      product,
      relatedProducts,
      categoryMappings
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải chi tiết sản phẩm.');
    res.redirect('/products');
  }
};

// Add a review to a product
exports.postAddReview = async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating, review } = req.body;
    
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      req.flash('error', 'Vui lòng đăng nhập để đánh giá sản phẩm.');
      return res.redirect('/auth/login');
    }
    
    const product = await Product.findOne({ slug });
    if (!product) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/products');
    }
    
    // Initialize ratings array if needed
    if (!product.ratings) {
      product.ratings = [];  
    }

    // Convert _reviews to ratings if present (backward compatibility)
    if ((product._doc._reviews || product._reviews) && (!product.ratings || product.ratings.length === 0)) {
      const reviewsData = product._doc._reviews || product._reviews;
      product.ratings = reviewsData.map(r => ({
        user: r.user,
        rating: r.rating,
        review: r.comment || r.review || '',
        date: r.date || Date.now()
      }));
    }

    // Check if user has already reviewed this product  
    const existingReviewIndex = product.ratings.findIndex(
      r => r.user && r.user.toString() === req.user._id.toString()
    );
    
    if (existingReviewIndex > -1) {
      // User has already reviewed - flash error and redirect
      req.flash('error', 'Bạn đã đánh giá sản phẩm này.');
      return res.redirect(`/products/${slug}`);
    }
    
    // Add new rating/review
    product.ratings.push({
      user: req.user._id,
      rating: parseInt(rating),
      review,
      date: Date.now()
    });
    
    // Calculate average rating
    const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = totalRating / product.ratings.length;
    
    await product.save();
    
    // If WebSocket is enabled, broadcast the new review
    if (global.broadcastReview) {
      const newReview = {
        user: {
          name: req.user.name
        },
        rating: parseInt(rating),
        review,
        date: new Date()
      };
      
      global.broadcastReview(slug, newReview);
    }
    
    req.flash('success', 'Cảm ơn bạn đã đánh giá sản phẩm!');
    res.redirect(`/products/${slug}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi gửi đánh giá.');
    res.redirect(`/products/${req.params.slug}`);
  }
};

// ===== PRE-ORDER & NOTIFICATION FUNCTIONS =====

const PreOrder = require('../models/preOrder');
const BackInStockNotification = require('../models/backInStockNotification');

/**
 * Đặt trước sản phẩm (Pre-order)
 */
exports.createPreOrder = async (req, res) => {
  try {
    const { productId, quantity, variant } = req.body;
    
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để đặt trước sản phẩm'
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Check if product allows pre-order
    if (!product.allowPreOrder) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm này không hỗ trợ đặt trước'
      });
    }
    
    // Check if product is actually out of stock
    if (product.stock > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm còn hàng, bạn có thể mua ngay'
      });
    }
    
    // Check for existing pre-order
    const existingPreOrder = await PreOrder.findOne({
      user: req.user._id,
      product: productId,
      status: { $in: ['pending', 'notified'] }
    });
    
    if (existingPreOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đặt trước sản phẩm này rồi'
      });
    }
    
    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ'
      });
    }

    // Create pre-order
    const preOrderData = {
      user: req.user._id,
      product: productId,
      quantity: quantity || 1,
      contactEmail: req.user.email,
      priceAtOrder: product.price
    };
    if (variant) {
      preOrderData.variant = variant;
    }
    const preOrder = await PreOrder.createPreOrder(preOrderData);
    
    res.json({
      success: true,
      message: 'Đặt trước thành công! Chúng tôi sẽ thông báo khi sản phẩm có hàng.',
      preOrder: {
        id: preOrder._id,
        product: product.name,
        quantity: preOrder.quantity,
        status: preOrder.status
      }
    });
    
  } catch (error) {
    console.error('Create pre-order error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt trước sản phẩm'
    });
  }
};

/**
 * Hủy đặt trước
 */
exports.cancelPreOrder = async (req, res) => {
  try {
    const { preOrderId } = req.params;
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }
    
    const preOrder = await PreOrder.findOne({
      _id: preOrderId,
      user: req.user._id
    });
    
    if (!preOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt trước'
      });
    }
    
    if (preOrder.status === 'converted' || preOrder.status === 'cancelled' || preOrder.status === 'expired') {
      req.flash('error', 'Không thể hủy đơn đặt trước này');
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn đặt trước này'
      });
    }
    
    preOrder.status = 'cancelled';
    await preOrder.save();
    
    res.json({
      success: true,
      message: 'Đã hủy đặt trước thành công'
    });
    
  } catch (error) {
    console.error('Cancel pre-order error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đặt trước'
    });
  }
};

/**
 * Lấy danh sách pre-orders của user
 */
exports.getUserPreOrders = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    
    const preOrders = await PreOrder.find({ user: req.user._id })
      .populate('product', 'name images slug price discountPrice')
      .sort({ createdAt: -1 });
    
    res.render('user/pre-orders', {
      title: 'Đơn đặt trước',
      preOrders
    });
    
  } catch (error) {
    console.error('Get user pre-orders error:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/user/profile');
  }
};

/**
 * Đăng ký nhận thông báo khi có hàng
 */
exports.subscribeNotification = async (req, res) => {
  try {
    const { productId, email, variant } = req.body;
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Check if product is actually out of stock
    if (product.stock > 0) {
      req.flash('error', 'Sản phẩm còn hàng, bạn có thể mua ngay');
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm còn hàng, bạn có thể mua ngay'
      });
    }
    
    // Subscribe
    try {
      const result = await BackInStockNotification.subscribe({
        email,
        product: productId,
        user: req.isAuthenticated() ? req.user._id : null,
        variant
      });
      
      if (result.alreadySubscribed) {
        req.flash('error', 'Bạn đã đăng ký nhận thông báo cho sản phẩm này');
        return res.json({
          success: true,
          message: 'Bạn đã đăng ký nhận thông báo cho sản phẩm này rồi'
        });
      }
      
      req.flash('success', 'Đăng ký thành công!');
      res.json({
        success: true,
        message: 'Đăng ký thành công! Chúng tôi sẽ gửi email khi sản phẩm có hàng.'
      });
    } catch (subscribeError) {
      if (subscribeError.message && subscribeError.message.includes('already')) {
        req.flash('error', 'Bạn đã đăng ký nhận thông báo cho sản phẩm này');
        return res.json({
          success: true,
          message: 'Bạn đã đăng ký nhận thông báo cho sản phẩm này'
        });
      }
      throw subscribeError;
    }
    
  } catch (error) {
    console.error('Subscribe notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký thông báo'
    });
  }
};

/**
 * Hủy đăng ký thông báo
 */
exports.unsubscribeNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }
    
    const notification = await BackInStockNotification.findOne({
      _id: notificationId,
      user: req.user._id
    });
    
    if (!notification) {
      req.flash('error', 'Không tìm thấy đăng ký thông báo');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đăng ký thông báo'
      });
    }
    
    if (notification.user && notification.user.toString() !== req.user._id.toString()) {
      req.flash('error', 'Bạn không có quyền hủy đăng ký này');
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đăng ký này'
      });
    }
    
    await BackInStockNotification.findByIdAndDelete(notificationId);
    
    req.flash('success', 'Đã hủy đăng ký thành công');
    res.json({
      success: true,
      message: 'Đã hủy đăng ký thành công'
    });
    
  } catch (error) {
    console.error('Unsubscribe notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đăng ký'
    });
  }
};

/**
 * Lấy danh sách thông báo đã đăng ký của user
 */
exports.getUserNotifications = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    
    const notifications = await BackInStockNotification.find({ 
      user: req.user._id,
      status: 'active'
    })
    .populate('product', 'name images slug price discountPrice stock')
    .sort({ createdAt: -1 });
    
    res.render('user/stock-notifications', {
      title: 'Thông báo hàng về',
      notifications
    });
    
  } catch (error) {
    console.error('Get user notifications error:', error);
    req.flash('error', 'Đã xảy ra lỗi');
    res.redirect('/user/profile');
  }
};
