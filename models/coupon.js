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
      validator: function (v) {
        return v && v.length >= 5 && v.length <= 9;
      },
      message: props => 'Mã giảm giá phải có từ 5 đến 9 ký tự!'
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
    default: null
  },
  maxUses: {
    type: Number,
    default: 10,
    max: 10
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
  if (!this.active) return false;
  if (this.usedCount >= this.maxUses) return false;

  // Kiểm tra thời hạn coupon
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;

  return true;
};

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

