const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * SearchHistory Model
 * Lưu lịch sử tìm kiếm của người dùng
 */
const searchHistorySchema = new Schema({
  // User thực hiện tìm kiếm (optional - guest search cũng được lưu)
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  // Từ khóa tìm kiếm
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  
  // Normalized query (lowercase, trimmed) để tìm kiếm nhanh
  normalizedQuery: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  
  // Số lần tìm kiếm từ khóa này (cho user cụ thể)
  searchCount: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Số kết quả trả về
  resultCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Filters đã áp dụng
  filters: {
    category: String,
    subcategory: String,
    brand: [String],
    minPrice: Number,
    maxPrice: Number,
    rating: Number,
    inStock: Boolean,
    hasDiscount: Boolean
  },
  
  // Nguồn tìm kiếm
  source: {
    type: String,
    enum: ['text', 'voice', 'suggestion'],
    default: 'text'
  },
  
  // IP Address (cho guest)
  ipAddress: {
    type: String
  },
  
  // User Agent
  userAgent: {
    type: String
  },
  
  // Sản phẩm đã click từ kết quả tìm kiếm
  clickedProducts: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    clickedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  lastSearchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index compound để tìm kiếm nhanh
searchHistorySchema.index({ user: 1, normalizedQuery: 1 });
searchHistorySchema.index({ normalizedQuery: 1, searchCount: -1 });
searchHistorySchema.index({ createdAt: -1 });

// Pre-save: Tạo normalized query
searchHistorySchema.pre('save', function(next) {
  if (this.query) {
    this.normalizedQuery = this.query.toLowerCase().trim();
  }
  next();
});

// Static: Lấy popular searches (trending)
searchHistorySchema.statics.getPopularSearches = async function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$normalizedQuery',
        originalQuery: { $first: '$query' },
        totalSearches: { $sum: '$searchCount' },
        avgResults: { $avg: '$resultCount' }
      }
    },
    { $match: { totalSearches: { $gte: 2 } } }, // Ít nhất 2 lần tìm kiếm
    { $sort: { totalSearches: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        query: '$originalQuery',
        searchCount: '$totalSearches',
        avgResults: { $round: ['$avgResults', 0] }
      }
    }
  ]);
};

// Static: Lấy lịch sử tìm kiếm của user
searchHistorySchema.statics.getUserHistory = async function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ lastSearchedAt: -1 })
    .limit(limit)
    .select('query resultCount source lastSearchedAt')
    .lean();
};

// Static: Thêm hoặc cập nhật lịch sử tìm kiếm
searchHistorySchema.statics.addOrUpdateSearch = async function(data) {
  const { user, query, resultCount, filters, source, ipAddress, userAgent } = data;
  
  if (!query || query.trim().length === 0) return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Tìm xem đã có record chưa
  const existing = await this.findOne({
    user: user || null,
    normalizedQuery
  });
  
  if (existing) {
    // Cập nhật record hiện có
    existing.searchCount += 1;
    existing.lastSearchedAt = new Date();
    existing.resultCount = resultCount || existing.resultCount;
    if (filters) existing.filters = filters;
    if (source) existing.source = source;
    return existing.save();
  }
  
  // Tạo mới
  return this.create({
    user: user || null,
    query: query.trim(),
    normalizedQuery,
    resultCount,
    filters,
    source: source || 'text',
    ipAddress,
    userAgent
  });
};

// Static: Xóa lịch sử tìm kiếm của user
searchHistorySchema.statics.clearUserHistory = async function(userId) {
  return this.deleteMany({ user: userId });
};

// Static: Xóa một search cụ thể
searchHistorySchema.statics.removeSearch = async function(userId, searchId) {
  return this.deleteOne({ _id: searchId, user: userId });
};

// Static: Lấy suggestions dựa trên query
searchHistorySchema.statics.getSuggestions = async function(query, userId = null, limit = 8) {
  if (!query || query.trim().length === 0) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  const suggestions = await this.aggregate([
    {
      $match: {
        normalizedQuery: { $regex: `^${normalizedQuery}`, $options: 'i' },
        resultCount: { $gt: 0 } // Chỉ lấy các query có kết quả
      }
    },
    {
      $group: {
        _id: '$normalizedQuery',
        originalQuery: { $first: '$query' },
        totalSearches: { $sum: '$searchCount' },
        avgResults: { $avg: '$resultCount' }
      }
    },
    { $sort: { totalSearches: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        query: '$originalQuery',
        searchCount: '$totalSearches'
      }
    }
  ]);
  
  return suggestions;
};

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
