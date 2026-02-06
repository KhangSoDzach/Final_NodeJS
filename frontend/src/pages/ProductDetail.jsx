import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/client';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/products/${slug}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="product-detail-page">
      <div className="image-gallery">
        <img src={product.mainImage} alt={product.name} />
        <div className="thumbnails">
          {product.images.map((img, index) => (
            <img key={index} src={img} alt={`Thumbnail ${index + 1}`} />
          ))}
        </div>
      </div>
      <div className="product-info">
        <h1>{product.name}</h1>
        <p>Price: {product.price}</p>
        <p>Rating: {product.rating}</p>
        <p>Brand: {product.brand}</p>
        <p>Specifications: {product.specs}</p>
        <div className="actions">
          <button>Add to Cart</button>
          <button>Add to Wishlist</button>
          <button>Add to Compare</button>
        </div>
      </div>
      <div className="tabs">
        <h2>Description</h2>
        <p>{product.description}</p>
        <h2>Specifications</h2>
        <p>{product.specifications}</p>
        <h2>Reviews</h2>
        {/* Add ReviewList and ReviewForm components here */}
        <h2>Q&A</h2>
        {/* Add QuestionList and QuestionForm components here */}
      </div>
    </div>
  );
};

export default ProductDetail;