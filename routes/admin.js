const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');
const couponController = require('../controllers/admin');
const ordersController = require('../controllers/admin');
const { isAuth, isAdmin } = require('../middleware/auth');
const { productUpload } = require('../middleware/upload');

// Import product routes
const productRoutes = require('./admin/products');

// Dashboard routes
router.get('/', isAuth, isAdmin, (req, res) => {
  res.redirect('/admin/dashboard');
});

router.get('/dashboard', isAuth, isAdmin, adminController.getDashboard);
router.get('/dashboard/data', isAuth, isAdmin, adminController.getDashboardData);

// Product management
router.get('/products', isAuth, isAdmin, adminController.getProducts);
router.get('/products/add', isAuth, isAdmin, adminController.getAddProduct);
router.post(
  '/products/add',
  isAuth,
  isAdmin,
  productUpload.array('images', 10),
  adminController.postAddProduct
);
router.get('/products/edit/:productId', isAuth, isAdmin, adminController.getEditProduct);
router.post(
  '/products/edit/:productId',
  isAuth,
  isAdmin,
  productUpload.array('images', 10),
  adminController.postUpdateProduct
);
router.delete('/products/delete/:productId', isAuth, isAdmin, adminController.deleteProduct);

// Order management
router.get('/orders', isAuth, isAdmin, adminController.getOrders);
router.get('/orders/:orderId', isAuth, isAdmin, adminController.getOrderDetail);
router.post('/orders/:orderId/status', isAuth, isAdmin, adminController.updateOrderStatus);

// Hiển thị form chỉnh sửa đơn hàng
router.get('/orders/edit/:orderId', isAuth, isAdmin, ordersController.getEditOrder);

// Xử lý cập nhật đơn hàng
router.post('/orders/edit/:orderId', isAuth, isAdmin, ordersController.postUpdateOrder);

// User management
router.get('/users', isAuth, isAdmin, adminController.getUsers);
router.get('/users/:userId', isAuth, isAdmin, adminController.getUserDetail);
router.post('/users/:userId/role', isAuth, isAdmin, adminController.updateUserRole);
router.post('/users/:userId/status', isAuth, isAdmin, adminController.updateUserStatus);

// Coupon management
router.get('/coupons', isAuth, isAdmin, couponController.getCoupons);
router.post('/coupons/add', isAuth, isAdmin, couponController.postAddCoupon);
router.delete('/coupons/delete/:couponId', isAuth, isAdmin, couponController.deleteCoupon);

// Hiển thị form thêm coupon
router.get('/coupons/add', isAuth, isAdmin, couponController.getAddCoupon);

module.exports = router;
