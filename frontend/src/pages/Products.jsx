import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import axios from '../api/client';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = searchParams.toString();
        const response = await axios.get(`/api/products?${query}`);
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const handleFilterChange = (filter) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      Object.keys(filter).forEach((key) => {
        if (filter[key]) {
          newParams.set(key, filter[key]);
        } else {
          newParams.delete(key);
        }
      });
      return newParams;
    });
  };

  return (
    <div className="products-page">
      <aside className="sidebar">
        <h2>Filters</h2>
        {/* Add filter components here */}
      </aside>
      <main className="main-content">
        <header className="products-header">
          <h1>Products</h1>
          {/* Add sorting and view switcher here */}
        </header>
        {loading ? <p>Loading...</p> : <ProductGrid products={products} />}
      </main>
    </div>
  );
};

export default Products;