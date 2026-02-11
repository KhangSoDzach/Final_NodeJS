const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  variants: { type: Object } // Thêm dòng này để lưu các lựa chọn variant
});

const statusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'shipping', 'delivered', 'cancelled'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String
  }
});

const orderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      // Only require user if it's not a guest order.
      // Treat orders with guestEmail or guestInfo.email as guest orders as well.
      const hasGuestEmail = !!(this.guestEmail || (this.guestInfo && this.guestInfo.email));
      return !(this.isGuestOrder || hasGuestEmail);
    }
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: false,
    min: 0
  },
  total: {
    type: Number,
    required: false,
    min: 0
  },
  shippingAddress: {
    name: String,
    fullName: String,
    street: String,
    address: String,
    city: String,
    district: String,
    ward: String,
    province: String,
    phone: String
  },
  paymentDetails: {
    type: Object,
    required: false,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
  couponCode: {
    type: String,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  }, loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsApplied: {
    type: Boolean,
    default: false
  },
  note: {
    type: String
  },

  // Guest Order Support
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  guestInfo: {
    name: String,
    email: String,
    phone: String,
    guestToken: String // Token để guest theo dõi đơn hàng
  },
  // Backwards-compatible guestEmail field (tests expect this)
  guestEmail: {
    type: String,
    required: false
  },

  // VAT Invoice Support
  vatInvoice: {
    type: Boolean,
    default: false
  },
  vatInfo: {
    companyName: String, // Tên công ty/cá nhân
    taxCode: String, // Mã số thuế
    address: String, // Địa chỉ xuất hóa đơn
    email: String // Email nhận hóa đơn
  },
  invoiceNumber: {
    type: String,
    sparse: true // Allow null but unique when set
  },
  invoiceGeneratedAt: {
    type: Date
  },

  // Backwards-compatible fields expected by tests
  paymentMethod: {
    type: String,
    required: false
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  loyaltyPointsDiscount: {
    type: Number,
    default: 0
  },
  vatInvoiceRequested: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },

  // One-click checkout
  usedDefaultAddress: {
    type: Boolean,
    default: false
  },

  // Shipping cost
  shippingCost: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index cho guest order tracking
orderSchema.index({ 'guestInfo.guestToken': 1 });
orderSchema.index({ 'guestInfo.email': 1 });
orderSchema.index({ invoiceNumber: 1 });

// Method to calculate loyalty points
orderSchema.methods.calculateLoyaltyPoints = function () {
  return Math.floor(this.totalAmount * 0.0001); // Tích lũy 0.01% giá trị đơn hàng (1/10000)
};

// Static: Find order by guest token
orderSchema.statics.findByGuestToken = function (token) {
  return this.findOne({ 'guestInfo.guestToken': token, isGuestOrder: true })
    .populate('items.product');
};

// Static: Find orders by guest email
orderSchema.statics.findByGuestEmail = function (email) {
  return this.find({ 'guestInfo.email': email.toLowerCase(), isGuestOrder: true })
    .sort({ createdAt: -1 })
    .populate('items.product');
};

// Generate unique guest token
orderSchema.statics.generateGuestToken = function () {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
