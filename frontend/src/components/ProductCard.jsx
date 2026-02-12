import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    if (!product) return null;

    const displayPrice = product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden hover-lift">
            <Link to={`/products/${product.slug || product._id}`} className="block">
                <div className="relative aspect-square">
                    <img
                        src={product.images?.[0] || product.image || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                    {product.discountPrice && product.discountPrice > 0 && (
                        <span className="absolute top-2 right-2 bg-accent text-white px-2 py-1 text-sm rounded-md font-semibold">
                            -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                        </span>
                    )}
                    {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Hết hàng</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-2">
                        {product.rating || product.averageRating ? (
                            <div className="flex items-center text-warning">
                                <span>★</span>
                                <span className="ml-1 text-sm text-gray-600">
                                    {(product.rating || product.averageRating).toFixed(1)}
                                </span>
                            </div>
                        ) : null}
                        {product.sold > 0 && (
                            <span className="text-xs text-gray-500">
                                Đã bán: {product.sold}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-accent font-bold text-lg">
                            {formatPrice(displayPrice)}
                        </span>
                        {product.discountPrice && product.discountPrice > 0 && (
                            <span className="text-gray-400 line-through text-sm">
                                {formatPrice(product.price)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
