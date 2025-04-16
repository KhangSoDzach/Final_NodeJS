const express = require('express');
const router = express.Router();

const productsController = require('../controllers/products');

// Get all products (with filters, sorting, pagination)
router.get('/', productsController.getProducts);

// Get single product by slug
router.get('/:slug', productsController.getProductDetail);

// Add a review to a product
router.post('/:slug/review', productsController.postAddReview);

const app = express();

app.use('/uploads', express.static('uploads'));

module.exports = router;
