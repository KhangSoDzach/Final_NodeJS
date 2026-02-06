const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * StockMovement Model - Quản lý lịch sử thay đổi tồn kho
 * Ghi nhận mọi hoạt động nhập/xuất kho để tracking và báo cáo
 */
const stockMovementSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  // Variant info (nếu có)
  variant: {
    name: { type: String },
    value: { type: String }
  },
  // Loại movement
  type: {
    type: String,
    enum: ['import', 'export', 'adjustment', 'return', 'order', 'cancel'],
    required: true
  },
  // Số lượng thay đổi (+ là nhập, - là xuất)
  quantity: {
    type: Number,
    required: true
  },
  // Tồn kho trước khi thay đổi
  previousStock: {
    type: Number,
    required: true
  },
  // Tồn kho sau khi thay đổi
  newStock: {
    type: Number,
    required: true
  },
  // Lý do thay đổi
  reason: {
    type: String,
    required: true,
    trim: true
  },
  // Reference đến Order (nếu là xuất kho do đơn hàng)
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  // Nhà cung cấp (nếu là nhập kho)
  supplier: {
    name: { type: String },
    invoiceNumber: { type: String },
    cost: { type: Number } // Giá nhập
  },
  // Admin thực hiện
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Ghi chú thêm
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes để query hiệu quả
stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

// Virtual để format hiển thị
stockMovementSchema.virtual('quantityDisplay').get(function () {
  if (this.quantity > 0) {
    return `+${this.quantity}`;
  }
  return this.quantity.toString();
});

// Static method: Tạo stock movement và cập nhật product stock
stockMovementSchema.statics.createMovement = async function (data) {
  const Product = mongoose.model('Product');

  // Support cả product và productId để tương thích
  const productId = data.productId || data.product;
  const userId = data.userId || data.createdBy;

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  // Tính toán quantity thực tế dựa trên type
  // import, return, cancel: tăng stock (+)
  // export, order: giảm stock (-)
  // adjustment: sử dụng giá trị gốc (có thể + hoặc -)
  let actualQuantity = Math.abs(data.quantity);

  switch (data.type) {
    case 'import':
    case 'return':
    case 'cancel':
      // Các loại tăng stock: luôn dương
      actualQuantity = Math.abs(data.quantity);
      break;
    case 'export':
    case 'order':
      // Các loại giảm stock: luôn âm
      actualQuantity = -Math.abs(data.quantity);
      break;
    case 'adjustment':
      // Adjustment: giữ nguyên dấu từ input
      actualQuantity = data.quantity;
      break;
    default:
      actualQuantity = data.quantity;
  }

  let previousStock, newStock;

  // Xử lý variant nếu có
  if (data.variant && data.variant.name && data.variant.value) {
    const variant = product.variants.find(v => v.name === data.variant.name);
    if (!variant) {
      throw new Error('Variant không tồn tại');
    }
    const option = variant.options.find(o => o.value === data.variant.value);
    if (!option) {
      throw new Error('Option của variant không tồn tại');
    }
    previousStock = option.stock;
    newStock = previousStock + actualQuantity;

    if (newStock < 0) {
      throw new Error('Không đủ tồn kho để thực hiện thao tác này');
    }

    option.stock = newStock;
  } else {
    previousStock = product.stock;
    newStock = previousStock + actualQuantity;

    if (newStock < 0) {
      throw new Error('Không đủ tồn kho để thực hiện thao tác này');
    }

    product.stock = newStock;
  }

  // Lưu product
  await product.save();

  // Tạo movement record
  const movement = new this({
    product: productId,
    variant: data.variant,
    type: data.type,
    quantity: actualQuantity,
    previousStock,
    newStock,
    reason: data.reason,
    order: data.orderId,
    supplier: data.supplier,
    createdBy: userId,
    notes: data.notes
  });

  await movement.save();

  // Nếu sản phẩm từ hết hàng thành có hàng, gửi thông báo
  if (previousStock === 0 && newStock > 0) {
    const BackInStockNotification = mongoose.model('BackInStockNotification');
    await BackInStockNotification.notifySubscribers(productId, data.variant);
  }

  return movement;
};

// Static method: Lấy lịch sử stock của sản phẩm
stockMovementSchema.statics.getProductHistory = async function (productId, options = {}) {
  const { limit = 50, page = 1, type } = options;
  const query = { product: productId };

  if (type) {
    query.type = type;
  }

  const movements = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('createdBy', 'name email')
    .populate('order', 'orderNumber');

  // Return array trực tiếp để đơn giản hóa API
  return movements;
};

// Static method: Tính tổng nhập/xuất trong khoảng thời gian
stockMovementSchema.statics.getSummary = async function (startDate, endDate, productId = null) {
  const match = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (productId) {
    match.product = new mongoose.Types.ObjectId(productId);
  }

  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalQuantity: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    }
  ]);

  return summary;
};

module.exports = mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);

