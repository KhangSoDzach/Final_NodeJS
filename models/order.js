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
  }
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
  statusHistory: [statusHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate loyalty points
orderSchema.methods.calculateLoyaltyPoints = function () {
  return Math.floor(this.totalAmount * 0.1); // Tích lũy 10% giá trị đơn hàng
};

module.exports = mongoose.model('Order', orderSchema);