const express = require('express');
const router = express.Router();

// API Controllers
const authApi = require('../controllers/api/auth');
const productsApi = require('../controllers/api/products');
const cartApi = require('../controllers/api/cart');
const ordersApi = require('../controllers/api/orders');
const userApi = require('../controllers/api/user');
const searchApi = require('../controllers/api/search');

// Mount API routes
router.use('/auth', authApi);
router.use('/products', productsApi);
router.use('/cart', cartApi);
router.use('/orders', ordersApi);
router.use('/user', userApi);
router.use('/search', searchApi);

module.exports = router;
