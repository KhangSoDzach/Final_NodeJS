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
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
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
    required: true,
    enum: ['laptop', 'pc', 'monitor', 'component', 'accessory']
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
  sold: {
    type: Number,
    default: 0
  },
  images: {
    type: String,
    default: []
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
  timestamps: true
});

// Virtual for product average rating
productSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) {
    return 0;
  }
  
  const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return totalRating / this.ratings.length;
});

// Method to check if a product is in stock
productSchema.methods.isInStock = function(quantity = 1) {
  return this.stock >= quantity;
};

// Method to check if a variant is in stock
productSchema.methods.isVariantInStock = function(variantName, variantValue, quantity = 1) {
  const variant = this.variants.find(v => v.name === variantName);
  if (!variant) return false;
  
  const option = variant.options.find(o => o.value === variantValue);
  if (!option) return false;
  
  return option.stock >= quantity;
};

module.exports = mongoose.model('Product', productSchema);
