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
  variants: { type: Object } // Thêm dòng này để lưu nhiều lựa chọn variant
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

// Cải tiến calculateTotal method với xử lý tốt hơn
cartSchema.methods.calculateTotal = function() {
  if (!this.items || this.items.length === 0) {
    return 0;
  }
  
  return this.items.reduce((total, item) => {
    if (!item || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      console.error('Invalid cart item:', JSON.stringify(item));
      return total; // Skip invalid items
    }
    return total + (item.price * item.quantity);
  }, 0);
};

// Cải tiến calculateTotalWithDiscount với xử lý lỗi toàn diện hơn
cartSchema.methods.calculateTotalWithDiscount = function() {
  const total = this.calculateTotal();

  // Nếu không có coupon, trả về tổng ban đầu
  if (!this.coupon) {
    return total;
  }

  try {
    // Log để debug
    console.log('Coupon data:', JSON.stringify(this.coupon || {}));

    // Kiểm tra chi tiết về coupon
    if (!this.coupon.code) {
      console.log('Missing coupon code, ignoring discount');
      return total;
    }
    
    if (!this.coupon.discount || typeof this.coupon.discount !== 'number') {
      console.log('Invalid discount value:', this.coupon.discount);
      return total;
    }
    
    if (this.coupon.discount <= 0 || this.coupon.discount > 100) {
      console.log('Discount out of range:', this.coupon.discount);
      return total;
    }

    // Tính toán số tiền giảm giá và tổng sau khi giảm
    const discountAmount = Math.round(total * (this.coupon.discount / 100));
    const finalTotal = total - discountAmount;
    
    console.log(`Original total: ${total}, Discount: ${this.coupon.discount}%, Amount off: ${discountAmount}, Final: ${finalTotal}`);
    
    return finalTotal;
  } catch (error) {
    console.error('Error calculating discount:', error);
    return total; // Fallback to original total on error
  }
};

module.exports = mongoose.model('Cart', cartSchema);
