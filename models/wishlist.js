/**
 * Wishlist Model - Danh sách sản phẩm yêu thích
 * Cho phép user lưu các sản phẩm quan tâm để mua sau
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Lưu giá tại thời điểm thêm vào wishlist để theo dõi biến động
  priceWhenAdded: {
    type: Number,
    required: true
  },
  // Thông báo khi giá giảm
  notifyOnPriceDrop: {
    type: Boolean,
    default: true
  }
});

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema]
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.product': 1 });

// Virtual để đếm số items
wishlistSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Method kiểm tra sản phẩm đã có trong wishlist chưa
wishlistSchema.methods.hasProduct = function(productId) {
  return this.items.some(item => 
    item.product.toString() === productId.toString()
  );
};

// Method thêm sản phẩm vào wishlist
wishlistSchema.methods.addProduct = async function(productId, price) {
  if (this.hasProduct(productId)) {
    return { success: false, message: 'Sản phẩm đã có trong danh sách yêu thích' };
  }
  
  this.items.push({
    product: productId,
    priceWhenAdded: price
  });
  
  await this.save();
  return { success: true, message: 'Đã thêm vào danh sách yêu thích' };
};

// Method xóa sản phẩm khỏi wishlist
wishlistSchema.methods.removeProduct = async function(productId) {
  const initialLength = this.items.length;
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
  
  if (this.items.length === initialLength) {
    return { success: false, message: 'Sản phẩm không có trong danh sách yêu thích' };
  }
  
  await this.save();
  return { success: true, message: 'Đã xóa khỏi danh sách yêu thích' };
};

// Method lấy danh sách sản phẩm có giá giảm
wishlistSchema.methods.getDiscountedProducts = async function() {
  await this.populate('items.product');
  
  return this.items.filter(item => {
    if (!item.product) return false;
    const currentPrice = item.product.discountPrice || item.product.price;
    return currentPrice < item.priceWhenAdded;
  });
};

// Static method tìm hoặc tạo wishlist cho user
wishlistSchema.statics.findOrCreate = async function(userId) {
  let wishlist = await this.findOne({ user: userId });
  
  if (!wishlist) {
    wishlist = new this({ user: userId, items: [] });
    await wishlist.save();
  }
  
  return wishlist;
};

// Đảm bảo virtuals được include khi convert to JSON
wishlistSchema.set('toJSON', { virtuals: true });
wishlistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
