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
  },  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Making user optional for guest checkout
  },
  guestEmail: {
    type: String,
    required: false // Email for guest users
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
  },  statusHistory: [statusHistorySchema],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate loyalty points
orderSchema.methods.calculateLoyaltyPoints = function () {
  return Math.floor(this.totalAmount * 0.0001); // Tích lũy 0.01% giá trị đơn hàng (1/10000)
};

module.exports = mongoose.model('Order', orderSchema);