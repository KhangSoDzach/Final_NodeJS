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
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    // Search query
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
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
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseInt(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseInt(req.query.maxPrice);
      }
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
      }
    }
    
    // Get products
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
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
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách sản phẩm.');
    res.redirect('/');
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
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/products');
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
      return res.redirect(`/auth/login?returnTo=/products/${slug}`);
    }
    
    const product = await Product.findOne({ slug });
    if (!product) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/products');
    }
    
    // BUG-009 FIX: Kiểm tra user đã mua sản phẩm chưa
    const Order = require('../models/order');
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': product._id,
      status: 'delivered'  // Chỉ cho review khi đơn hàng đã được giao
    });
    
    if (!hasPurchased) {
      req.flash('error', 'Bạn cần mua và nhận sản phẩm này trước khi đánh giá.');
      return res.redirect(`/products/${slug}`);
    }
    
    // Check if user has already reviewed this product
    const existingReviewIndex = product.ratings.findIndex(
      r => r.user && r.user.toString() === req.user._id.toString()
    );
    
    if (existingReviewIndex > -1) {
      // Update existing review
      product.ratings[existingReviewIndex].rating = rating;
      product.ratings[existingReviewIndex].review = review;
      product.ratings[existingReviewIndex].date = Date.now();
    } else {
      // Add new review
      product.ratings.push({
        user: req.user._id,
        rating: parseInt(rating),
        review,
        date: Date.now()
      });
    }
    
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
