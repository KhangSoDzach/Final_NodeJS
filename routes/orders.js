const express = require('express');
const router = express.Router();

const ordersController = require('../controllers/orders');
const { isAuth } = require('../middleware/auth');

// Get checkout page
router.get('/checkout', ordersController.getCheckout);

// Create a new order
router.post('/create', ordersController.postOrder);

// Get all user orders
router.get('/', isAuth, ordersController.getOrders);

// Get single order by id
router.get('/:orderId', isAuth, ordersController.getOrderDetail);

module.exports = router;
