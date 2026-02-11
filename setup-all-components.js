const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Created directory: ${dirPath}`);
    }
}

// Write file function
function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Created file: ${filePath}`);
    } catch (error) {
        console.error(`✗ Error creating file ${filePath}:`, error.message);
    }
}

console.log('\n=== Creating Component Library ===\n');

// Create all directories
const dirs = [
    'src/components/products',
    'src/components/cart',
    'src/components/common/forms',
    'src/components/common'
];

dirs.forEach(dir => ensureDir(dir));

console.log('\n=== Creating Components ===\n');

// All component files
const components = {
    // ===== PRODUCT COMPONENTS =====
    'src/components/products/ProductCard.jsx': `/**
 * ProductCard Component
 * 
 * Displays a product card with image, name, price, rating, and action buttons
 * 
 * @example
 * <ProductCard
 *   product={{
 *     _id: '123',
 *     name: 'Product Name',
 *     price: 99.99,
 *     image: '/images/product.jpg',
 *     rating: 4.5,
 *     numReviews: 10,
 *     stock: 5
 *   }}
 *   onAddToCart={(id) => console.log('Add to cart:', id)}
 *   onQuickView={(id) => console.log('Quick view:', id)}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const { _id, name, price, image, rating = 0, numReviews = 0, stock = 0 } = product;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 fill-gray-300" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={image || '/images/placeholder.jpg'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
        {stock > 0 && stock < 5 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Only {stock} left
          </div>
        )}
        <button
          onClick={() => onQuickView && onQuickView(_id)}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
          aria-label="Quick view"
        >
          <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium">
            Quick View
          </span>
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer">
          {name}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <div className="flex">{renderStars(rating)}</div>
          <span className="text-sm text-gray-600">
            ({numReviews} {numReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            \${typeof price === 'number' ? price.toFixed(2) : '0.00'}
          </span>
        </div>

        <button
          onClick={() => onAddToCart && onAddToCart(_id)}
          disabled={stock === 0}
          className={\`w-full py-2 px-4 rounded-lg font-medium transition-colors \${
            stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }\`}
          aria-label={stock === 0 ? 'Out of stock' : 'Add to cart'}
        >
          {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
    rating: PropTypes.number,
    numReviews: PropTypes.number,
    stock: PropTypes.number,
  }).isRequired,
  onAddToCart: PropTypes.func,
  onQuickView: PropTypes.func,
};

export default ProductCard;
`,

    'src/components/products/ProductGrid.jsx': `/**
 * ProductGrid Component
 * 
 * Grid layout wrapper for displaying products
 * 
 * @example
 * <ProductGrid>
 *   <ProductCard product={product1} />
 *   <ProductCard product={product2} />
 * </ProductGrid>
 */

import React from 'react';
import PropTypes from 'prop-types';

const ProductGrid = ({ children, columns = 4, gap = 6 }) => {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };

  const gapClasses = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div
      className={\`grid \${columnClasses[columns] || columnClasses[4]} \${
        gapClasses[gap] || gapClasses[6]
      }\`}
    >
      {children}
    </div>
  );
};

ProductGrid.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.oneOf([2, 3, 4, 5]),
  gap: PropTypes.oneOf([4, 6, 8]),
};

export default ProductGrid;
`,

    'src/components/products/ProductFilter.jsx': `/**
 * ProductFilter Component
 * 
 * Sidebar filters for products (category, brand, price range)
 * 
 * @example
 * <ProductFilter
 *   categories={['Electronics', 'Clothing']}
 *   brands={['Apple', 'Samsung']}
 *   priceRange={{ min: 0, max: 1000 }}
 *   selectedFilters={{ category: [], brand: [], priceMin: 0, priceMax: 1000 }}
 *   onFilterChange={(filters) => console.log(filters)}
 * />
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ProductFilter = ({
  categories = [],
  brands = [],
  priceRange = { min: 0, max: 1000 },
  selectedFilters = {},
  onFilterChange,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    brand: true,
    price: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category) => {
    const currentCategories = selectedFilters.category || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    onFilterChange({
      ...selectedFilters,
      category: newCategories,
    });
  };

  const handleBrandChange = (brand) => {
    const currentBrands = selectedFilters.brand || [];
    const newBrands = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];

    onFilterChange({
      ...selectedFilters,
      brand: newBrands,
    });
  };

  const handlePriceChange = (type, value) => {
    onFilterChange({
      ...selectedFilters,
      [type === 'min' ? 'priceMin' : 'priceMax']: Number(value),
    });
  };

  const handleClearAll = () => {
    onFilterChange({
      category: [],
      brand: [],
      priceMin: priceRange.min,
      priceMax: priceRange.max,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {categories.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full mb-3"
            aria-expanded={expandedSections.category}
          >
            <span className="font-semibold text-gray-800">Category</span>
            <svg
              className={\`w-5 h-5 transform transition-transform \${
                expandedSections.category ? 'rotate-180' : ''
              }\`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.category && (
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={(selectedFilters.category || []).includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {brands.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('brand')}
            className="flex items-center justify-between w-full mb-3"
            aria-expanded={expandedSections.brand}
          >
            <span className="font-semibold text-gray-800">Brand</span>
            <svg
              className={\`w-5 h-5 transform transition-transform \${
                expandedSections.brand ? 'rotate-180' : ''
              }\`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.brand && (
            <div className="space-y-2">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={(selectedFilters.brand || []).includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-3"
          aria-expanded={expandedSections.price}
        >
          <span className="font-semibold text-gray-800">Price Range</span>
          <svg
            className={\`w-5 h-5 transform transition-transform \${
              expandedSections.price ? 'rotate-180' : ''
            }\`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min Price</label>
              <input
                type="number"
                min={priceRange.min}
                max={selectedFilters.priceMax || priceRange.max}
                value={selectedFilters.priceMin || priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Price</label>
              <input
                type="number"
                min={selectedFilters.priceMin || priceRange.min}
                max={priceRange.max}
                value={selectedFilters.priceMax || priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              \${selectedFilters.priceMin || priceRange.min} - \${selectedFilters.priceMax || priceRange.max}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ProductFilter.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string),
  brands: PropTypes.arrayOf(PropTypes.string),
  priceRange: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  selectedFilters: PropTypes.shape({
    category: PropTypes.arrayOf(PropTypes.string),
    brand: PropTypes.arrayOf(PropTypes.string),
    priceMin: PropTypes.number,
    priceMax: PropTypes.number,
  }),
  onFilterChange: PropTypes.func.isRequired,
};

export default ProductFilter;
`,

    'src/components/products/ProductSort.jsx': `/**
 * ProductSort Component
 * 
 * Dropdown for sorting products
 * 
 * @example
 * <ProductSort
 *   value="price_asc"
 *   onChange={(value) => console.log('Sort by:', value)}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';

const ProductSort = ({ value, onChange }) => {
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'rating', label: 'Rating' },
    { value: 'popular', label: 'Most Popular' },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="product-sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

ProductSort.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ProductSort;
`,

    'src/components/products/ReviewList.jsx': `/**
 * ReviewList Component
 * 
 * Displays list of product reviews
 * 
 * @example
 * <ReviewList
 *   reviews={[
 *     { _id: '1', user: 'John', rating: 5, comment: 'Great!', createdAt: '2024-01-01' }
 *   ]}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';

const ReviewList = ({ reviews = [] }) => {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <svg
          key={i}
          className={\`w-5 h-5 \${i < rating ? 'fill-yellow-400' : 'fill-gray-300'}\`}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-800">{review.user?.name || 'Anonymous'}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          
          {review.isVerifiedPurchase && (
            <div className="mt-3 flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Verified Purchase
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      user: PropTypes.shape({
        name: PropTypes.string,
      }),
      rating: PropTypes.number.isRequired,
      comment: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      isVerifiedPurchase: PropTypes.bool,
    })
  ),
};

export default ReviewList;
`,

    'src/components/products/ReviewForm.jsx': `/**
 * ReviewForm Component
 * 
 * Form for adding product reviews
 * 
 * @example
 * <ReviewForm
 *   onSubmit={(data) => console.log('Review submitted:', data)}
 * />
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ReviewForm = ({ onSubmit, isSubmitting = false }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!comment.trim()) {
      newErrors.comment = 'Please enter a review';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ rating, comment: comment.trim() });
      setRating(0);
      setComment('');
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Write a Review</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={\`Rate \${star} star\${star > 1 ? 's' : ''}\`}
            >
              <svg
                className={\`w-8 h-8 transition-colors \${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400'
                    : 'fill-gray-300'
                }\`}
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="5"
          className={\`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent \${
            errors.comment ? 'border-red-500' : 'border-gray-300'
          }\`}
          placeholder="Share your experience with this product..."
        />
        {errors.comment && (
          <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {comment.length} characters (minimum 10)
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={\`w-full py-3 px-4 rounded-lg font-medium transition-colors \${
          isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }\`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

ReviewForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export default ReviewForm;
`,

    'src/components/products/QuestionList.jsx': `/**
 * QuestionList Component
 * 
 * Displays Q&A section for products
 * 
 * @example
 * <QuestionList
 *   questions={[
 *     { _id: '1', user: 'John', question: 'Is this waterproof?', answer: 'Yes!', createdAt: '2024-01-01' }
 *   ]}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';

const QuestionList = ({ questions = [] }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No questions yet. Be the first to ask!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((item) => (
        <div key={item._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">Q</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">
                    {item.user?.name || 'Anonymous'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{item.question}</p>
              </div>
            </div>
          </div>

          {item.answer && (
            <div className="ml-11 pl-4 border-l-2 border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">A</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {item.answeredBy?.name || 'Seller'}
                    </span>
                    {item.answeredAt && (
                      <span className="text-sm text-gray-500">
                        {formatDate(item.answeredAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              </div>
            </div>
          )}

          {!item.answer && (
            <div className="ml-11 text-sm text-gray-500 italic">
              Waiting for answer...
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

QuestionList.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      user: PropTypes.shape({
        name: PropTypes.string,
      }),
      question: PropTypes.string.isRequired,
      answer: PropTypes.string,
      answeredBy: PropTypes.shape({
        name: PropTypes.string,
      }),
      createdAt: PropTypes.string.isRequired,
      answeredAt: PropTypes.string,
    })
  ),
};

export default QuestionList;
`,

    'src/components/products/QuestionForm.jsx': `/**
 * QuestionForm Component
 * 
 * Form for asking product questions
 * 
 * @example
 * <QuestionForm
 *   onSubmit={(data) => console.log('Question submitted:', data)}
 * />
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const QuestionForm = ({ onSubmit, isSubmitting = false }) => {
  const [question, setQuestion] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!question.trim()) {
      newErrors.question = 'Please enter your question';
    } else if (question.trim().length < 10) {
      newErrors.question = 'Question must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ question: question.trim() });
      setQuestion('');
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Ask a Question</h3>

      <div className="mb-4">
        <label htmlFor="question-input" className="block text-sm font-medium text-gray-700 mb-2">
          Your Question *
        </label>
        <textarea
          id="question-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows="4"
          className={\`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent \${
            errors.question ? 'border-red-500' : 'border-gray-300'
          }\`}
          placeholder="Ask anything about this product..."
        />
        {errors.question && (
          <p className="mt-1 text-sm text-red-600">{errors.question}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {question.length} characters (minimum 10)
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={\`w-full py-3 px-4 rounded-lg font-medium transition-colors \${
          isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }\`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Question'}
      </button>
    </form>
  );
};

QuestionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export default QuestionForm;
`,
};

// Write all files
Object.entries(components).forEach(([filePath, content]) => {
    writeFile(filePath, content);
});

console.log(`\n=== ${Object.keys(components).length} Product Components Created! ===\n`);
console.log('Next: Run "node setup-cart-components.js" for cart components\n');
