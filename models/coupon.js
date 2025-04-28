const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
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
    required: true
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
