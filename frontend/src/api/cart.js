import axios from './client';

export const fetchCart = () => axios.get('/api/cart');
export const addItemToCart = (item) => axios.post('/api/cart', item);
export const updateCartItem = (itemId, quantity) => axios.put(`/api/cart/${itemId}`, { quantity });
export const removeCartItem = (itemId) => axios.delete(`/api/cart/${itemId}`);