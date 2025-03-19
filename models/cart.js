const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
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
  variant: {
    name: String,
    value: String
  }
});

const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate total price
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Method to calculate total with discount
cartSchema.methods.calculateTotalWithDiscount = function() {
  const total = this.calculateTotal();
  
  if (!this.coupon) {
    return total;
  }
  
  const discountAmount = total * (this.coupon.discount / 100);
  return total - discountAmount;
};

module.exports = mongoose.model('Cart', cartSchema);
