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
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
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
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    name: String,
    street: String,
    district: String,
    province: String,
    phone: String
  },
  paymentDetails: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
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
  },  loyaltyPointsEarned: {
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
orderSchema.statics.findByGuestToken = function(token) {
  return this.findOne({ 'guestInfo.guestToken': token, isGuestOrder: true })
    .populate('items.product');
};

// Static: Find orders by guest email
orderSchema.statics.findByGuestEmail = function(email) {
  return this.find({ 'guestInfo.email': email.toLowerCase(), isGuestOrder: true })
    .sort({ createdAt: -1 })
    .populate('items.product');
};

// Generate unique guest token
orderSchema.statics.generateGuestToken = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('Order', orderSchema);