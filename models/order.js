const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variant: {
    name: String,
    value: String
  }
});

const addressSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
});

const statusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
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
    type: String
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
  shippingAddress: addressSchema,
  paymentMethod: {
    type: String,
    enum: ['cod', 'bank_transfer', 'credit_card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  statusHistory: [statusHistorySchema],
  couponCode: {
    type: String
  },
  discount: {
    type: Number,
    default: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
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

// Apply auto-increment functionality for orderNumber
orderSchema.plugin(AutoIncrement, {
  inc_field: 'orderNumberCounter',
  start_seq: 1000
});

// Pre-save middleware to generate the order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    // Format: SC + Year + Month + Counter (e.g., SC2023071001)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.orderNumber = `SC${year}${month}${this.orderNumberCounter}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
