const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/productController');
const { isAuth, isAdmin } = require('../../middleware/auth');
const { productUpload } = require('../../middleware/upload');

// Quản lý danh sách sản phẩm
router.get('/', isAuth, isAdmin, productController.getProducts);

// Thêm sản phẩm mới
router.get('/add', isAuth, isAdmin, productController.getAddProduct);
router.post(
  '/add',
  isAuth,
  isAdmin,
  productUpload.array('images', 10),
  productController.postAddProduct
);

// Chỉnh sửa sản phẩm
router.get('/edit/:productId', isAuth, isAdmin, productController.getEditProduct);
router.post(
  '/edit/:productId',
  isAuth,
  isAdmin,
  productUpload.array('images', 10),
  productController.postUpdateProduct
);

// Xóa sản phẩm
router.delete('/delete/:productId', isAuth, isAdmin, productController.deleteProduct);

// Quản lý tồn kho
router.get('/inventory', isAuth, isAdmin, productController.getInventory);
router.post('/inventory/:productId', isAuth, isAdmin, productController.updateInventory);

// Quản lý danh mục
router.get('/categories', isAuth, isAdmin, productController.getCategories);

// Thống kê sản phẩm
router.get('/statistics', isAuth, isAdmin, productController.getProductStatistics);

// Xuất dữ liệu sản phẩm
router.get('/export', isAuth, isAdmin, productController.exportProducts);

// API tìm kiếm sản phẩm nâng cao
router.get('/search', isAuth, isAdmin, productController.searchProducts);

module.exports = router;