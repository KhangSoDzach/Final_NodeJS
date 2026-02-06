const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  fullName: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  street: {
    type: String,
    required: false
  },
  district: {
    type: String,
    required: false
  },
  province: {
    type: String,
    required: false
  },
  default: {
    type: Boolean,
    default: false
  }
});

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function () {
      // Only require password if googleId is not present
      return !this.googleId;
    }
  },
  phone: {
    type: String
  },
  googleId: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],  // BUG-011 FIX: Thống nhất chỉ dùng 'customer' và 'admin'
    default: 'customer'
  },
  addresses: [addressSchema],
  defaultAddress: addressSchema,
  savedAddresses: [addressSchema],
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String
  },
  bannedAt: {
    type: Date
  },
  resetToken: {
    type: String
  },
  resetTokenExpiration: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

