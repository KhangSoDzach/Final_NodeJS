const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
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
    required: function() {
      return !this.googleId; // Password required only if no Google ID
    }
  },
  googleId: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String
  },
  addresses: [addressSchema],
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  resetToken: String,
  resetTokenExpiration: Date,
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

// Virtual for default address
userSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(address => address.default);
});

module.exports = mongoose.model('User', userSchema);
