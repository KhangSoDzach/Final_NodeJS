const express = require('express');
const router = express.Router();

// API Controllers
const productsApi = require('../controllers/api/products');
const searchApi = require('../controllers/api/search');

// Products API
router.use('/products', productsApi);

// Search API
router.use('/search', searchApi);

module.exports = router;
