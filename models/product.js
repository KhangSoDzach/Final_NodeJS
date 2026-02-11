const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    sparse: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: null
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: false
  },
  brand: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  // Ngưỡng cảnh báo hết hàng
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  // Cho phép đặt hàng trước khi hết hàng
  allowPreOrder: {
    type: Boolean,
    default: false
  },
  // Ngày dự kiến có hàng (cho pre-order)
  estimatedRestockDate: {
    type: Date
  },
  // SKU - Mã sản phẩm nội bộ
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  sold: {
    type: Number,
    default: 0
  },
  images: {
    type: [String],
    required: true
  },
  specifications: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      value: {
        type: String,
        required: true
      },
      additionalPrice: {
        type: Number,
        default: 0
      },
      stock: {
        type: Number,
        min: 0,
        default: 0
      }
    }]
  }],
  ratings: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Alternative 'reviews' field for backward compatibility  
  _reviews: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    date: {
      type: Date
    }
  }],
  featured: {
    type: Boolean,
    default: false
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
  timestamps: true,
  strict: false,  // Allow 'reviews' field for test compatibility
  toJSON: { virtuals: true },  // Enable reviews virtual in JSON
  toObject: { virtuals: true }  // Enable reviews virtual in objects
});

// Pre-save hook to convert _reviews to ratings
productSchema.pre('validate', function (next) {
  // If _reviews field is present, convert to ratings
  if (this._reviews && Array.isArray(this._reviews) && this._reviews.length > 0) {
    this.ratings = this._reviews.map(r => ({
      user: r.user,
      rating: r.rating,
      review: r.comment || r.review || '',
      date: r.date || Date.now()
    }));
  }
  next();
});

// Pre-save hook to generate slug if not provided
productSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    // Generate slug from name
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual property 'reviews' maps to 'ratings'
productSchema.virtual('reviews').get(function () {
  // Support both _reviews and ratings
  if (this.ratings && this.ratings.length > 0) {
    return this.ratings.map(r => ({
      user: r.user,
      rating: r.rating,
      comment: r.review,
      date: r.date
    }));
  }
  if (this._reviews && this._reviews.length > 0) {
    return this._reviews;
  }
  return [];
});

productSchema.virtual('reviews').set(function (val) {
  // When reviews is set, store in _reviews
  this._reviews = val;
});

// Virtual for product average rating
productSchema.virtual('averageRating').get(function () {
  if (this.ratings.length === 0) {
    return 0;
  }

  const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return totalRating / this.ratings.length;
});

// Virtual: Kiểm tra sản phẩm sắp hết hàng
productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Virtual: Kiểm tra sản phẩm hết hàng
productSchema.virtual('isOutOfStock').get(function () {
  return this.stock <= 0;
});

// Virtual: Trạng thái tồn kho
productSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) {
    return this.allowPreOrder ? 'pre-order' : 'out-of-stock';
  }
  if (this.stock <= this.lowStockThreshold) {
    return 'low-stock';
  }
  return 'in-stock';
});

// Method to check if a product is in stock
productSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Method to check if a variant is in stock
productSchema.methods.isVariantInStock = function (variantName, variantValue, quantity = 1) {
  const variant = this.variants.find(v => v.name === variantName);
  if (!variant) return false;

  const option = variant.options.find(o => o.value === variantValue);
  if (!option) return false;

  return option.stock >= quantity;
};

// Helper method to update stock and track sales
productSchema.methods.updateStock = function (quantity, isVariant = false, variantName = null, variantValue = null) {
  if (isVariant && variantName && variantValue) {
    const variant = this.variants.find(v => v.name === variantName);
    if (variant) {
      const option = variant.options.find(o => o.value === variantValue);
      if (option) {
        option.stock -= quantity;
      }
    }
  } else {
    this.stock -= quantity;
  }

  // Always update the sold count for the product
  this.sold += quantity;

  return this;
};

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

