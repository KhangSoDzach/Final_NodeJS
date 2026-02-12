import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductGrid = ({ products }) => {
    if (!products || products.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Không có sản phẩm nào.</p>
            </div>
        );
    }

    return (
        <div className="product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;
