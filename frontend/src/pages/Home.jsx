import React, { useEffect, useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import axios from '../api/client';

const Home = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [newRes, bestRes] = await Promise.all([
          axios.get('/api/products?sort=newest&limit=8'),
          axios.get('/api/products?sort=bestseller&limit=8')
        ]);
        setNewProducts(newRes.data);
        setBestSellers(bestRes.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="home-page">
      <section className="hero-slider">Hero Slider Placeholder</section>
      <section className="new-products">
        <h2>Sản phẩm mới</h2>
        {loading ? <p>Loading...</p> : <ProductGrid products={newProducts} />}
      </section>
      <section className="best-sellers">
        <h2>Sản phẩm bán chạy</h2>
        {loading ? <p>Loading...</p> : <ProductGrid products={bestSellers} />}
      </section>
      <section className="categories">
        <h2>Categories</h2>
        {/* Placeholder for categories */}
      </section>
    </div>
  );
};

export default Home;