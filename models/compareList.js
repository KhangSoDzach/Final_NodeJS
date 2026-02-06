/**
 * Compare List Model - Danh sách so sánh sản phẩm
 * Lưu trong session, tối đa 4 sản phẩm cùng category
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho session-based compare (optional, có thể dùng session trực tiếp)
const compareListSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  category: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 giờ
  }
}, {
  timestamps: true
});

// TTL index để tự động xóa sau khi hết hạn
compareListSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Constants
compareListSchema.statics.MAX_COMPARE_ITEMS = 4;

// Method thêm sản phẩm vào compare
compareListSchema.methods.addProduct = async function (product) {
  // Kiểm tra số lượng
  if (this.products.length >= 4) {
    return {
      success: false,
      message: 'Chỉ được so sánh tối đa 4 sản phẩm'
    };
  }

  // Kiểm tra đã có sản phẩm này chưa
  if (this.products.some(p => p.toString() === product._id.toString())) {
    return {
      success: false,
      message: 'Sản phẩm đã có trong danh sách so sánh'
    };
  }

  // Kiểm tra category (nếu đã có sản phẩm)
  if (this.products.length > 0 && this.category !== product.category) {
    return {
      success: false,
      message: 'Chỉ có thể so sánh sản phẩm cùng danh mục'
    };
  }

  // Thêm sản phẩm
  this.products.push(product._id);
  if (!this.category) {
    this.category = product.category;
  }

  await this.save();
  return { success: true, message: 'Đã thêm vào danh sách so sánh' };
};

// Method xóa sản phẩm khỏi compare
compareListSchema.methods.removeProduct = async function (productId) {
  const initialLength = this.products.length;
  this.products = this.products.filter(p => p.toString() !== productId.toString());

  if (this.products.length === initialLength) {
    return { success: false, message: 'Sản phẩm không có trong danh sách so sánh' };
  }

  // Reset category nếu không còn sản phẩm nào
  if (this.products.length === 0) {
    this.category = null;
  }

  await this.save();
  return { success: true, message: 'Đã xóa khỏi danh sách so sánh' };
};

// Method xóa tất cả
compareListSchema.methods.clear = async function () {
  this.products = [];
  this.category = null;
  await this.save();
  return { success: true, message: 'Đã xóa danh sách so sánh' };
};

// Static method tìm hoặc tạo compare list
compareListSchema.statics.findOrCreate = async function (sessionId, userId = null) {
  let compareList = await this.findOne({
    $or: [
      { sessionId },
      ...(userId ? [{ user: userId }] : [])
    ]
  });

  if (!compareList) {
    compareList = new this({
      sessionId,
      user: userId,
      products: []
    });
    await compareList.save();
  }

  return compareList;
};

module.exports = mongoose.models.CompareList || mongoose.model('CompareList', compareListSchema);

