const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders');
const { isAuth } = require('../middleware/auth');

// Checkout page
router.get('/checkout', ordersController.getCheckout);

// Process order
router.post('/create', ordersController.postOrder);

// Order detail
router.get('/:orderId', isAuth, ordersController.getOrderDetail);

// Payment page for existing orders
router.get('/pay/:orderId', isAuth, ordersController.getPaymentPage);

// Process payment for existing orders
router.post('/pay/:orderId', isAuth, ordersController.processPayment);

// Order list
router.get('/', isAuth, ordersController.getOrders);

module.exports = router;
