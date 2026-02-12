const Product = require('../models/product');
const SearchHistory = require('../models/searchHistory');

/**
 * Search Controller
 * Xử lý autocomplete, lịch sử tìm kiếm, và search suggestions
 */

// GET /search/suggestions - Autocomplete suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }
    
    const query = q.trim();
    const userId = req.user ? req.user._id : null;
    
    // Tìm kiếm trong products
    const productSuggestions = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name slug category brand images price discountPrice')
    .limit(5)
    .lean();
    
    // Tìm kiếm trong search history (popular searches)
    const historySuggestions = await SearchHistory.getSuggestions(query, userId, 5);
    
    // Lấy categories phù hợp
    const categories = await Product.distinct('category', {
      category: { $regex: query, $options: 'i' }
    });
    
    // Lấy brands phù hợp
    const brands = await Product.distinct('brand', {
      brand: { $regex: query, $options: 'i' }
    });
    
    res.json({
      success: true,
      suggestions: {
        products: productSuggestions.map(p => ({
          _id: p._id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          brand: p.brand,
          image: p.images && p.images.length > 0 ? p.images[0] : null,
          price: p.discountPrice || p.price
        })),
        queries: historySuggestions.map(s => s.query),
        categories: categories.slice(0, 5),
        brands: brands.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /search/history - Lấy lịch sử tìm kiếm của user
exports.getHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ success: true, history: [] });
    }
    
    const history = await SearchHistory.getUserHistory(req.user._id, 20);
    
    res.json({
      success: true,
      history: history.map(h => ({
        id: h._id,
        query: h.query,
        resultCount: h.resultCount,
        source: h.source,
        searchedAt: h.lastSearchedAt
      }))
    });
  } catch (error) {
    console.error('Error getting search history:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /search/history - Xóa toàn bộ lịch sử tìm kiếm
exports.clearHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    
    await SearchHistory.clearUserHistory(req.user._id);
    
    res.json({
      success: true,
      message: 'Đã xóa lịch sử tìm kiếm'
    });
  } catch (error) {
    console.error('Error clearing search history:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /search/history/:id - Xóa một search cụ thể
exports.removeSearchItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    
    const { id } = req.params;
    await SearchHistory.removeSearch(req.user._id, id);
    
    res.json({
      success: true,
      message: 'Đã xóa'
    });
  } catch (error) {
    console.error('Error removing search item:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /search/popular - Lấy các từ khóa tìm kiếm phổ biến
exports.getPopularSearches = async (req, res) => {
  try {
    const popular = await SearchHistory.getPopularSearches(10);
    
    res.json({
      success: true,
      popular
    });
  } catch (error) {
    console.error('Error getting popular searches:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /search/track - Ghi nhận tìm kiếm
exports.trackSearch = async (req, res) => {
  try {
    const { query, resultCount, filters, source } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
    }
    
    const searchData = {
      user: req.user ? req.user._id : null,
      query: query.trim(),
      resultCount: resultCount || 0,
      filters: filters || {},
      source: source || 'text',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    await SearchHistory.addOrUpdateSearch(searchData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /search/filters - Lấy tất cả options cho advanced filters
exports.getFilterOptions = async (req, res) => {
  try {
    const { category } = req.query;
    
    // Build filter cho category nếu có
    const categoryFilter = category ? { category: { $regex: new RegExp(`^${category}$`, 'i') } } : {};
    
    // Lấy tất cả unique values
    const [categories, brands, subcategories, specs] = await Promise.all([
      Product.distinct('category'),
      Product.distinct('brand', categoryFilter),
      Product.distinct('subcategory', categoryFilter),
      getUniqueSpecs(categoryFilter)
    ]);
    
    // Lấy price range
    const priceStats = await Product.aggregate([
      { $match: categoryFilter },
      {
        $group: {
          _id: null,
          minPrice: { $min: { $ifNull: ['$discountPrice', '$price'] } },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    const priceRange = priceStats.length > 0 
      ? { min: priceStats[0].minPrice, max: priceStats[0].maxPrice }
      : { min: 0, max: 100000000 };
    
    res.json({
      success: true,
      filters: {
        categories,
        brands,
        subcategories: subcategories.filter(s => s), // Remove null/undefined
        priceRange,
        specs,
        ratings: [5, 4, 3, 2, 1],
        stockOptions: [
          { value: 'all', label: 'Tất cả' },
          { value: 'in-stock', label: 'Còn hàng' },
          { value: 'out-of-stock', label: 'Hết hàng' },
          { value: 'pre-order', label: 'Đặt trước' }
        ],
        discountOptions: [
          { value: 'all', label: 'Tất cả' },
          { value: 'has-discount', label: 'Đang giảm giá' },
          { value: 'no-discount', label: 'Giá gốc' }
        ]
      }
    });
  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Helper: Lấy unique specifications theo category
async function getUniqueSpecs(filter = {}) {
  const specs = await Product.aggregate([
    { $match: filter },
    { $unwind: '$specifications' },
    {
      $group: {
        _id: '$specifications.name',
        values: { $addToSet: '$specifications.value' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Chỉ lấy specs phổ biến (RAM, CPU, GPU, Màn hình, Storage...)
  const commonSpecs = ['RAM', 'CPU', 'GPU', 'VGA', 'Màn hình', 'Ổ cứng', 'SSD', 'HDD', 'Kích thước màn hình', 'Card đồ họa'];
  
  return specs
    .filter(s => commonSpecs.some(cs => s._id.toLowerCase().includes(cs.toLowerCase())))
    .map(s => ({
      name: s._id,
      values: s.values.sort()
    }));
}
