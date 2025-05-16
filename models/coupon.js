const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v.length === 5;
      },
      message: props => 'Mã giảm giá phải có đúng 5 ký tự!'
    }
  },
  description: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Discount in percentage
  },
  minAmount: {
    type: Number,
    default: 0,
    min: 0 // Minimum order amount to apply the coupon
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: function() {
      // Default to 90 days from now if not provided
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }
  },
  maxUses: {
    type: Number,
    default: null // Unlimited if null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();

  if (!this.active) return false;
  if (now < this.startDate || now > this.endDate) return false;
  if (this.maxUses !== null && this.usedCount >= this.maxUses) return false;

  return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
