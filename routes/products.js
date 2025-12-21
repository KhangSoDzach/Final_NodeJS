const express = require('express');
const router = express.Router();

const productsController = require('../controllers/products');

// Get all products (with filters, sorting, pagination)
router.get('/', productsController.getProducts);

// Get single product by slug
router.get('/:slug', productsController.getProductDetail);

// Add a review to a product
router.post('/:slug/review', productsController.postAddReview);

// ===== PRE-ORDER & NOTIFICATION ROUTES =====

// Pre-order routes
router.post('/pre-order', productsController.createPreOrder);
router.delete('/pre-order/:preOrderId', productsController.cancelPreOrder);

// Back in stock notification routes  
router.post('/notify', productsController.subscribeNotification);
router.get('/notify/unsubscribe', productsController.unsubscribeNotification);

module.exports = router;
