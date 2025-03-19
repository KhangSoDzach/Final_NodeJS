const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart');

// Get cart page
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.post('/update', cartController.updateCart);

// Remove item from cart
router.delete('/remove/:itemId', cartController.removeItem);

// Apply coupon code
router.post('/apply-coupon', cartController.applyCoupon);

// Remove coupon
router.delete('/remove-coupon', cartController.removeCoupon);

module.exports = router;
