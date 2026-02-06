const express = require('express');
const router = express.Router();

// API Controllers
const productsApi = require('../controllers/api/products');
const searchApi = require('../controllers/api/search');

// Products API
router.get('/products', productsApi.apiGetProducts);
router.get('/products/:slug', productsApi.apiGetProductDetail);
router.get('/products/category/:category', productsApi.apiGetProductsByCategory);

// Search API
router.get('/search', searchApi.apiSearch);
router.get('/search/suggestions', searchApi.apiSuggestions);

module.exports = router;
