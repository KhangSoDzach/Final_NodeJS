const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * BackInStockNotification Model - Quản lý đăng ký thông báo khi có hàng trở lại
 * Cho phép user đăng ký nhận thông báo khi sản phẩm hết hàng có hàng lại
 */
const backInStockNotificationSchema = new Schema({
  // User đăng ký (có thể null nếu là guest)
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  // Email để gửi thông báo
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
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
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'notified', 'unsubscribed'],
    default: 'active'
  },
  // Ngày gửi thông báo
  notifiedAt: {
    type: Date
  },
  // Số lần gửi thông báo (để tránh spam)
  notificationCount: {
    type: Number,
    default: 0
  },
  // Nguồn đăng ký (web, app, email campaign...)
  source: {
    type: String,
    default: 'web'
  },
  // IP đăng ký (để chống spam)
  ipAddress: {
    type: String
  },
  // User agent
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index để tránh duplicate
backInStockNotificationSchema.index(
  { email: 1, product: 1, 'variant.name': 1, 'variant.value': 1 },
  { unique: true }
);
backInStockNotificationSchema.index({ status: 1, product: 1 });

// Static method: Đăng ký nhận thông báo
backInStockNotificationSchema.statics.subscribe = async function (data) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(data.productId);

  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  // Kiểm tra sản phẩm có hết hàng không
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

  if (currentStock > 0) {
    throw new Error('Sản phẩm vẫn còn hàng');
  }

  // Tìm subscription hiện có
  const existingSubscription = await this.findOne({
    email: data.email.toLowerCase(),
    product: data.productId,
    'variant.name': data.variant?.name || null,
    'variant.value': data.variant?.value || null
  });

  if (existingSubscription) {
    // Nếu đã unsubscribed, cho phép đăng ký lại
    if (existingSubscription.status === 'unsubscribed') {
      existingSubscription.status = 'active';
      existingSubscription.notificationCount = 0;
      await existingSubscription.save();
      return existingSubscription;
    }

    // Nếu đã notified, cho phép đăng ký lại
    if (existingSubscription.status === 'notified') {
      existingSubscription.status = 'active';
      await existingSubscription.save();
      return existingSubscription;
    }

    throw new Error('Bạn đã đăng ký nhận thông báo cho sản phẩm này rồi');
  }

  const subscription = new this({
    user: data.userId,
    email: data.email.toLowerCase(),
    product: data.productId,
    variant: data.variant,
    source: data.source || 'web',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent
  });

  await subscription.save();
  return subscription;
};

// Static method: Hủy đăng ký
backInStockNotificationSchema.statics.unsubscribe = async function (email, productId, variant = null) {
  const query = {
    email: email.toLowerCase(),
    product: productId
  };

  if (variant && variant.name && variant.value) {
    query['variant.name'] = variant.name;
    query['variant.value'] = variant.value;
  }

  const subscription = await this.findOne(query);

  if (!subscription) {
    throw new Error('Không tìm thấy đăng ký');
  }

  subscription.status = 'unsubscribed';
  await subscription.save();
  return subscription;
};

// Static method: Gửi thông báo cho tất cả subscriber khi có hàng
backInStockNotificationSchema.statics.notifySubscribers = async function (productId, variant = null) {
  const query = {
    product: productId,
    status: 'active'
  };

  if (variant && variant.name && variant.value) {
    query['variant.name'] = variant.name;
    query['variant.value'] = variant.value;
  }

  const subscriptions = await this.find(query)
    .populate('product', 'name slug images price discountPrice');

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const emailService = require('../utils/emailService');
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await emailService.sendBackInStockNotification(subscription);

      subscription.status = 'notified';
      subscription.notifiedAt = new Date();
      subscription.notificationCount += 1;
      await subscription.save();

      sent++;
    } catch (error) {
      console.error(`Lỗi gửi thông báo đến ${subscription.email}:`, error);
      failed++;
    }
  }

  return { sent, failed };
};

// Static method: Lấy số lượng subscriber của sản phẩm
backInStockNotificationSchema.statics.getSubscriberCount = async function (productId, variant = null) {
  const query = {
    product: productId,
    status: 'active'
  };

  if (variant && variant.name && variant.value) {
    query['variant.name'] = variant.name;
    query['variant.value'] = variant.value;
  }

  return this.countDocuments(query);
};

// Static method: Lấy danh sách subscriber của user
backInStockNotificationSchema.statics.getUserSubscriptions = async function (userId) {
  return this.find({ user: userId, status: 'active' })
    .populate('product', 'name slug images price discountPrice stock')
    .sort({ createdAt: -1 });
};

// Static method: Xóa các subscription đã thông báo quá 30 ngày
backInStockNotificationSchema.statics.cleanupOldNotifications = async function () {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await this.deleteMany({
    status: 'notified',
    notifiedAt: { $lt: thirtyDaysAgo }
  });

  return result.deletedCount;
};

module.exports = mongoose.models.BackInStockNotification || mongoose.model('BackInStockNotification', backInStockNotificationSchema);

