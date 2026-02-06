import axios from './client';

export const fetchNewestProducts = () => axios.get('/api/products?sort=newest&limit=8');
export const fetchBestSellers = () => axios.get('/api/products?sort=bestseller&limit=8');
export const fetchProductBySlug = (slug) => axios.get(`/api/products/${slug}`);
export const fetchProducts = (query) => axios.get(`/api/products?${query}`);