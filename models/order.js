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
  district: {
    type: String,
    required: true
  },
  province: {
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

// Schema cho thông tin chi tiết thanh toán
const paymentDetailsSchema = new Schema({
  // Thông tin thẻ tín dụng
  cardType: String,
  cardLast4: String,
  cardHolder: String,
  cardExpiry: String,
  
  // Thông tin chuyển khoản ngân hàng
  bankName: String,
  accountNumber: String,
  accountName: String,
  referenceCode: String,
  
  // Thông tin giao dịch
  transactionId: String,
  transactionDate: Date,
  receiptUrl: String
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: {
    type: Number,
    unique: true
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
  paymentDetails: paymentDetailsSchema,
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
  inc_field: 'orderNumber',
  start_seq: 10000
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

// Calculate subtotal (before discount)
orderSchema.methods.calculateSubtotal = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Calculate discount amount
orderSchema.methods.calculateDiscountAmount = function() {
  if (!this.discount) return 0;
  return Math.round(this.calculateSubtotal() * this.discount / 100);
};

// Static method to get monthly sales
orderSchema.statics.getMonthlySales = async function(year) {
  const currentYear = year || new Date().getFullYear();
  
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalSales: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
