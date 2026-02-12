const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * PreOrder Model - Quản lý đặt hàng trước cho sản phẩm hết hàng
 * Cho phép khách hàng đặt trước sản phẩm khi hết hàng
 */
const preOrderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
  // Số lượng đặt trước
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  // Giá tại thời điểm đặt trước (để đảm bảo giá cho khách)
  priceAtOrder: {
    type: Number,
    required: true
  },
  // Tiền đặt cọc (nếu có)
  depositAmount: {
    type: Number,
    default: 0
  },
  depositPaid: {
    type: Boolean,
    default: false
  },
  // Trạng thái đặt trước
  status: {
    type: String,
    enum: ['pending', 'notified', 'converted', 'cancelled', 'expired'],
    default: 'pending'
  },
  // Ngày dự kiến có hàng
  estimatedDate: {
    type: Date
  },
  // Thông tin liên hệ
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String
  },
  // Ghi chú của khách
  customerNotes: {
    type: String,
    trim: true
  },
  // Ghi chú admin
  adminNotes: {
    type: String,
    trim: true
  },
  // Ngày thông báo có hàng
  notifiedAt: {
    type: Date
  },
  // Order được tạo từ pre-order này
  convertedOrder: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  // Thời hạn hoàn tất đơn sau khi thông báo (mặc định 48h)
  expiresAt: {
    type: Date
  },
  // Ưu tiên (để xếp hàng khi có hàng)
  priority: {
    type: Number,
    default: 0 // Số càng lớn càng ưu tiên
  }
}, {
  timestamps: true
});

// Compound index để tránh duplicate pre-order
preOrderSchema.index({ user: 1, product: 1, 'variant.name': 1, 'variant.value': 1, status: 1 });
preOrderSchema.index({ status: 1, createdAt: 1 });

// Virtual: Kiểm tra pre-order đã hết hạn chưa
preOrderSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Static method: Tạo pre-order mới
preOrderSchema.statics.createPreOrder = async function (data) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(data.productId);

  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  // Kiểm tra sản phẩm đã hết hàng chưa
  let currentStock = product.stock;
  if (data.variant && data.variant.name && data.variant.value) {
    const variant = product.variants.find(v => v.name === data.variant.name);
    if (variant) {
      const option = variant.options.find(o => o.value === data.variant.value);
      if (option) {
        currentStock = option.stock;
      }
    }
  }

  // Nếu còn hàng, không cần pre-order
  if (currentStock > 0) {
    throw new Error('Sản phẩm vẫn còn hàng, không cần đặt trước');
  }

  // Kiểm tra user đã có pre-order cho sản phẩm này chưa
  const existingPreOrder = await this.findOne({
    user: data.userId,
    product: data.productId,
    'variant.name': data.variant?.name,
    'variant.value': data.variant?.value,
    status: { $in: ['pending', 'notified'] }
  });

  if (existingPreOrder) {
    throw new Error('Bạn đã đặt trước sản phẩm này rồi');
  }

  // Tính giá
  let price = product.discountPrice || product.price;
  if (data.variant && data.variant.name && data.variant.value) {
    const variant = product.variants.find(v => v.name === data.variant.name);
    if (variant) {
      const option = variant.options.find(o => o.value === data.variant.value);
      if (option) {
        price += option.additionalPrice || 0;
      }
    }
  }

  const User = mongoose.model('User');
  const user = await User.findById(data.userId);

  const preOrder = new this({
    user: data.userId,
    product: data.productId,
    variant: data.variant,
    quantity: data.quantity || 1,
    priceAtOrder: price,
    depositAmount: data.depositAmount || 0,
    contactEmail: data.contactEmail || user.email,
    contactPhone: data.contactPhone || user.phone,
    customerNotes: data.customerNotes,
    estimatedDate: data.estimatedDate
  });

  await preOrder.save();
  return preOrder;
};

// Static method: Thông báo pre-order khi có hàng
preOrderSchema.statics.notifyWhenInStock = async function (productId, variant = null) {
  const query = {
    product: productId,
    status: 'pending'
  };

  if (variant && variant.name && variant.value) {
    query['variant.name'] = variant.name;
    query['variant.value'] = variant.value;
  }

  const preOrders = await this.find(query)
    .sort({ priority: -1, createdAt: 1 }) // Ưu tiên cao trước, sau đó theo thời gian
    .populate('user', 'name email')
    .populate('product', 'name slug images');

  const emailService = require('../utils/emailService');
  const notifiedIds = [];

  for (const preOrder of preOrders) {
    try {
      // Gửi email thông báo
      await emailService.sendPreOrderNotification(preOrder);

      // Cập nhật trạng thái
      preOrder.status = 'notified';
      preOrder.notifiedAt = new Date();
      preOrder.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 giờ
      await preOrder.save();

      notifiedIds.push(preOrder._id);
    } catch (error) {
      console.error(`Lỗi gửi thông báo pre-order ${preOrder._id}:`, error);
    }
  }

  return notifiedIds;
};

// Static method: Chuyển pre-order thành đơn hàng
preOrderSchema.statics.convertToOrder = async function (preOrderId, orderData) {
  const preOrder = await this.findById(preOrderId);

  if (!preOrder) {
    throw new Error('Pre-order không tồn tại');
  }

  if (preOrder.status !== 'notified') {
    throw new Error('Pre-order chưa được thông báo có hàng');
  }

  if (preOrder.isExpired) {
    preOrder.status = 'expired';
    await preOrder.save();
    throw new Error('Pre-order đã hết hạn');
  }

  // Tạo order từ pre-order
  const Order = mongoose.model('Order');
  const order = new Order({
    ...orderData,
    preOrder: preOrderId
  });

  await order.save();

  // Cập nhật pre-order
  preOrder.status = 'converted';
  preOrder.convertedOrder = order._id;
  await preOrder.save();

  return { preOrder, order };
};

// Static method: Hủy các pre-order đã hết hạn
preOrderSchema.statics.expireOldPreOrders = async function () {
  const result = await this.updateMany(
    {
      status: 'notified',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );

  return result.modifiedCount;
};

// Static method: Lấy danh sách pre-order của user
preOrderSchema.statics.getUserPreOrders = async function (userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('product', 'name slug images price discountPrice stock');
};

// Static method: Đếm số pre-order theo sản phẩm
preOrderSchema.statics.countByProduct = async function (productId) {
  return this.countDocuments({
    product: productId,
    status: { $in: ['pending', 'notified'] }
  });
};

module.exports = mongoose.models.PreOrder || mongoose.model('PreOrder', preOrderSchema);

