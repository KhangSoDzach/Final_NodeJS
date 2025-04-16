const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');
const { isAuth, isAdmin } = require('../middleware/auth');
const { productUpload } = require('../middleware/upload');

// Nhập router quản lý sản phẩm
const productRoutes = require('./admin/products');

// Dashboard
router.get('/', isAuth, isAdmin, adminController.getDashboard);

// Sử dụng router quản lý sản phẩm
router.use('/products', productRoutes);

// Order management
router.get('/orders', isAuth, isAdmin, adminController.getOrders);
router.get('/orders/:orderId', isAuth, isAdmin, adminController.getOrderDetail);
router.post('/orders/:orderId/status', isAuth, isAdmin, adminController.updateOrderStatus);

// User management
router.get('/users', isAuth, isAdmin, adminController.getUsers);
router.get('/users/:userId', isAuth, isAdmin, adminController.getUserDetail);
router.post('/users/:userId/role', isAuth, isAdmin, adminController.updateUserRole);

// Coupon management
router.get('/coupons', isAuth, isAdmin, adminController.getCoupons);
router.get('/coupons/add', isAuth, isAdmin, adminController.getAddCoupon);
router.post('/coupons/add', isAuth, isAdmin, adminController.postAddCoupon);
router.get('/coupons/edit/:couponId', isAuth, isAdmin, adminController.getEditCoupon);
router.post('/coupons/edit/:couponId', isAuth, isAdmin, adminController.postUpdateCoupon);
router.delete('/coupons/delete/:couponId', isAuth, isAdmin, adminController.deleteCoupon);

module.exports = router;
