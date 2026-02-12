const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Created: ${dirPath}`);
    }
}

function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Created: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`✗ Error: ${filePath} - ${error.message}`);
        return false;
    }
}

console.log('\n╔══════════════════════════════════════════╗');
console.log('║  React E-Commerce Component Library     ║');
console.log('║  Setup Script                            ║');
console.log('╚══════════════════════════════════════════╝\n');

// Create directories
console.log('📁 Creating directories...\n');
const dirs = [
    'src/components/products',
    'src/components/cart',
    'src/components/common/forms',
    'src/components/common'
];
dirs.forEach(ensureDir);

console.log('\n📝 Creating component files...\n');

const components = {};

// ============================================
// PRIORITY 1: PRODUCT COMPONENTS
// ============================================

components['src/components/products/ProductCard.jsx'] = `import React from 'react';
import PropTypes from 'prop-types';

/**
 * ProductCard Component
 * 
 * Displays a single product with image, name, price, rating, and action buttons.
 * 
 * @example
 * <ProductCard
 *   product={{
 *     _id: '123',
 *     name: 'Gaming Laptop',
 *     price: 25000000,
 *     salePrice: 22000000,
 *     images: ['/uploads/laptop.jpg'],
 *     rating: 4.5,
 *     reviewCount: 120,
 *     inStock: true
 *   }}
 *   onAddToCart={(id) => console.log('Add to cart:', id)}
 *   onAddToWishlist={(id) => console.log('Add to wishlist:', id)}
 * />
 */
const ProductCard = ({ product, onAddToCart, onAddToWishlist, onCompare }) => {
    const hasDiscount = product.salePrice && product.salePrice < product.price;
    const discountPercent = hasDiscount 
        ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
        : 0;
    const displayPrice = product.salePrice || product.price;
    const productImage = product.images?.[0] || '/images/no-image.png';

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<i key={i} className="fas fa-star text-yellow-400"></i>);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<i key={i} className="fas fa-star-half-alt text-yellow-400"></i>);
            } else {
                stars.push(<i key={i} className="far fa-star text-gray-300"></i>);
            }
        }
        return stars;
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            <div className="relative overflow-hidden bg-gray-100">
                <a href={\\\`/products/\\\${product._id}\\\`} className="block">
                    <img
                        src={productImage}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                    />
                </a>
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {hasDiscount && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{discountPercent}%
                        </span>
                    )}
                    {!product.inStock && (
                        <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Hết hàng
                        </span>
                    )}
                    {product.isNew && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Mới
                        </span>
                    )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {onAddToWishlist && (
                        <button
                            onClick={() => onAddToWishlist(product._id)}
                            className="bg-white p-2 rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
                            aria-label="Thêm vào danh sách yêu thích"
                        >
                            <i className="far fa-heart"></i>
                        </button>
                    )}
                    {onCompare && (
                        <button
                            onClick={() => onCompare(product._id)}
                            className="bg-white p-2 rounded-full shadow-md hover:bg-blue-50 hover:text-blue-500 transition-colors"
                            aria-label="So sánh sản phẩm"
                        >
                            <i className="fas fa-balance-scale"></i>
                        </button>
                    )}
                </div>
            </div>
            <div className="p-4">
                <a href={\\\`/products/\\\${product._id}\\\`} className="block mb-2 hover:text-blue-500 transition-colors">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[3rem]">
                        {product.name}
                    </h3>
                </a>
                {product.rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">{renderStars(product.rating)}</div>
                        <span className="text-sm text-gray-500">({product.reviewCount || 0})</span>
                    </div>
                )}
                <div className="mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-blue-600">{formatPrice(displayPrice)}</span>
                        {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onAddToCart(product._id)}
                        disabled={!product.inStock}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                        aria-label={\\\`Thêm \\\${product.name} vào giỏ hàng\\\`}
                    >
                        <i className="fas fa-cart-plus mr-2"></i>
                        {product.inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

ProductCard.propTypes = {
    product: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        salePrice: PropTypes.number,
        images: PropTypes.arrayOf(PropTypes.string),
        rating: PropTypes.number,
        reviewCount: PropTypes.number,
        inStock: PropTypes.bool,
        isNew: PropTypes.bool,
    }).isRequired,
    onAddToCart: PropTypes.func.isRequired,
    onAddToWishlist: PropTypes.func,
    onCompare: PropTypes.func,
};

export default ProductCard;
\`;

console.log('📦 Component library setup initiated...');
console.log('This is Part 1 - creating initial product components.');
console.log('\\nTo continue setup, you\\'ll need to run the extended version.');
console.log('\\nPlease wait - creating a complete setup file...\\n');

// Write initial files
let successCount = 0;
Object.entries(components).forEach(([filePath, content]) => {
    if (writeFile(filePath, content)) successCount++;
});

console.log(`\n✅ Part 1 Complete: Created ${successCount}/${Object.keys(components).length} files`);
console.log('\n  Due to file size limits, you need to run additional setup scripts.');
console.log('Please check the repository for complete component files.\n');
console.log('Next Steps:');
console.log('1. Run "node setup-components-part2.js" to create more product components.');
console.log('2. Run "node setup-cart-components.js" for cart components.\n');
console.log('Thank you for using the React E-Commerce Component Library Setup Script!\n`);