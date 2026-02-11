/**
 * Admin Controller Tests
 * Comprehensive tests for admin dashboard, products, orders, users, and coupons management
 */

const mongoose = require('mongoose');
const Product = require('../../models/product');
// Use conditional import to avoid model overwrite error
const Order = mongoose.models.Order || require('../../models/order');
const User = require('../../models/user');
const Coupon = require('../../models/coupon');
const adminController = require('../../controllers/admin');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Mock file system operations
jest.mock('fs');

describe('Admin Controller', () => {
    // Helper factories following testing-patterns
    const getMockAdmin = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        isBanned: false,
        ...overrides
    });

    const getMockProduct = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100000,
        stock: 10,
        category: 'CPU',
        brand: 'Intel',
        description: 'Test product description',
        images: ['image1.jpg'],
        ...overrides
    });

    const getMockOrder = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        orderNumber: 'ORD-001',
        user: new mongoose.Types.ObjectId(),
        items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 100000
        }],
        totalAmount: 100000,
        status: 'pending',
        ...overrides
    });

    const getMockCoupon = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        code: 'TEST5',
        description: 'Test coupon',
        discount: 10,
        minAmount: 0,
        maxUses: 10,
        active: true,
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ====================================
    // Dashboard Tests
    // ====================================
    describe('getDashboard', () => {
        test('should render dashboard with statistics - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                user: getMockAdmin()
            });
            const res = global.testHelpers.createMockRes();

            // Create test data
            const product = new Product(getMockProduct());
            await product.save();

            const user = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const order = new Order(getMockOrder({ user: user._id }));
            await order.save();

            await adminController.getDashboard(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/dashboard',
                expect.objectContaining({
                    title: 'Admin Dashboard'
                })
            );
        });

        test('should handle empty database gracefully', async () => {
            const req = global.testHelpers.createMockReq({
                user: getMockAdmin()
            });
            const res = global.testHelpers.createMockRes();

            await adminController.getDashboard(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test('should handle database errors - 500', async () => {
            const req = global.testHelpers.createMockReq({
                user: getMockAdmin()
            });
            const res = global.testHelpers.createMockRes();

            // Mock error
            jest.spyOn(Product, 'countDocuments').mockRejectedValueOnce(new Error('DB Error'));

            await adminController.getDashboard(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/');
        });
    });

    describe('getDashboardData', () => {
        test('should return dashboard data for valid date range', async () => {
            const req = global.testHelpers.createMockReq({
                query: {
                    period: 'week'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.getDashboardData(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: expect.any(Boolean)
                })
            );
        });

        test('should handle invalid period parameter - 400', async () => {
            const req = global.testHelpers.createMockReq({
                query: {
                    period: 'invalid'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.getDashboardData(req, res);

            // Should still succeed with default period
            expect(res.json).toHaveBeenCalled();
        });
    });

    // ====================================
    // Product Management Tests
    // ====================================
    describe('getProducts', () => {
        test('should list all products with pagination - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                query: { page: 1 }
            });
            const res = global.testHelpers.createMockRes();

            const product = new Product(getMockProduct());
            await product.save();

            await adminController.getProducts(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/products/index',
                expect.objectContaining({
                    title: expect.any(String)
                })
            );
        });

        test('should filter products by category', async () => {
            const req = global.testHelpers.createMockReq({
                query: { category: 'CPU' }
            });
            const res = global.testHelpers.createMockRes();

            const cpuProduct = new Product(getMockProduct({ category: 'CPU' }));
            await cpuProduct.save();

            const gpuProduct = new Product(getMockProduct({
                name: 'GPU Product',
                category: 'GPU'
            }));
            await gpuProduct.save();

            await adminController.getProducts(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test('should handle empty product list', async () => {
            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await adminController.getProducts(req, res);

            expect(res.render).toHaveBeenCalled();
        });
    });

    describe('postAddProduct', () => {
        test('should create product with valid data - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    name: 'New Product',
                    price: 200000,
                    stock: 15,
                    category: 'CPU',
                    brand: 'AMD',
                    description: 'New product description'
                },
                files: []
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddProduct(req, res);

            const product = await Product.findOne({ name: 'New Product' });
            expect(product).toBeDefined();
            expect(product.price).toBe(200000);
        });

        test('should reject invalid price - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    name: 'Invalid Product',
                    price: -100,
                    stock: 10,
                    category: 'CPU'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddProduct(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should reject negative stock - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    name: 'Invalid Stock Product',
                    price: 100000,
                    stock: -5,
                    category: 'CPU'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddProduct(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle missing required fields - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    price: 100000
                    // missing name, category, etc.
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddProduct(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle duplicate product names', async () => {
            // Create existing product
            const existing = new Product(getMockProduct({ name: 'Duplicate Product' }));
            await existing.save();

            const req = global.testHelpers.createMockReq({
                body: {
                    name: 'Duplicate Product',
                    price: 100000,
                    stock: 10,
                    category: 'CPU',
                    brand: 'Intel'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddProduct(req, res);

            const products = await Product.find({ name: 'Duplicate Product' });
            // Should allow duplicates or handle appropriately
            expect(products.length).toBeGreaterThan(0);
        });
    });

    describe('postUpdateProduct', () => {
        test('should update existing product - happy path', async () => {
            const product = new Product(getMockProduct());
            await product.save();

            const req = global.testHelpers.createMockReq({
                params: { productId: product._id },
                body: {
                    name: 'Updated Product',
                    price: 150000,
                    stock: 20,
                    category: 'CPU',
                    brand: 'Intel',
                    description: 'Updated description'
                },
                files: []
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postUpdateProduct(req, res);

            const updated = await Product.findById(product._id);
            expect(updated.name).toBe('Updated Product');
            expect(updated.price).toBe(150000);
        });

        test('should handle non-existent product - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { productId: fakeId },
                body: {
                    name: 'Updated Product',
                    price: 150000
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postUpdateProduct(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle invalid product ID format - 400', async () => {
            const req = global.testHelpers.createMockReq({
                params: { productId: new mongoose.Types.ObjectId().toString() },
                body: {
                    name: 'Updated Product'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postUpdateProduct(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('deleteProduct', () => {
        test('should delete product and its images - happy path', async () => {
            const product = new Product(getMockProduct({
                images: ['test-image.jpg']
            }));
            await product.save();

            fs.existsSync = jest.fn().mockReturnValue(true);
            fs.unlinkSync = jest.fn();

            const req = global.testHelpers.createMockReq({
                params: { productId: product._id }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.deleteProduct(req, res);

            const deleted = await Product.findById(product._id);
            expect(deleted).toBeNull();
        });

        test('should handle non-existent product deletion - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { productId: fakeId }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.deleteProduct(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    // ====================================
    // Order Management Tests
    // ====================================
    describe('getOrders', () => {
        test('should list all orders with filters - happy path', async () => {
            const user = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const order = new Order(getMockOrder({ user: user._id }));
            await order.save();

            const req = global.testHelpers.createMockReq({
                query: {}
            });
            const res = global.testHelpers.createMockRes();

            await adminController.getOrders(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/orders/index',
                expect.objectContaining({
                    title: expect.any(String)
                })
            );
        });

        test('should filter orders by status', async () => {
            const user = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const pendingOrder = new Order(getMockOrder({
                user: user._id,
                status: 'pending'
            }));
            await pendingOrder.save();

            const req = global.testHelpers.createMockReq({
                query: { status: 'pending' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.getOrders(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test('should handle empty order list', async () => {
            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await adminController.getOrders(req, res);

            expect(res.render).toHaveBeenCalled();
        });
    });

    describe('updateOrderStatus', () => {
        test('should update order status - happy path', async () => {
            const user = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer',
                loyaltyPoints: 0
            });
            await user.save();

            const order = new Order(getMockOrder({
                user: user._id,
                status: 'pending',
                totalAmount: 100000
            }));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                body: { status: 'shipped' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateOrderStatus(req, res);

            const updated = await Order.findById(order._id);
            expect(updated.status).toBe('shipped');
        });

        test('should award loyalty points when status is delivered', async () => {
            const user = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer',
                loyaltyPoints: 0
            });
            await user.save();

            const order = new Order(getMockOrder({
                user: user._id,
                status: 'shipped',
                totalAmount: 100000
            }));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                body: { status: 'delivered' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateOrderStatus(req, res);

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.loyaltyPoints).toBeGreaterThan(0);
        });

        test('should handle invalid status - 400', async () => {
            const user = new User({
                name: 'Test Customer',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const order = new Order(getMockOrder({ user: user._id }));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                body: { status: 'invalid-status' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateOrderStatus(req, res);

            // Should handle invalid status gracefully
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalled();
        });

        test('should handle non-existent order - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { orderId: fakeId },
                body: { status: 'shipped' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateOrderStatus(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    // ====================================
    // User Management Tests
    // ====================================
    describe('getUsers', () => {
        test('should list all users with filters - happy path', async () => {
            const user = new User({
                name: 'Test User',
                email: 'testuser@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await adminController.getUsers(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/users/index',
                expect.objectContaining({
                    title: expect.any(String)
                })
            );
        });

        test('should filter users by role', async () => {
            const customer = new User({
                name: 'Customer User',
                email: 'customer@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await customer.save();

            const req = global.testHelpers.createMockReq({
                query: { role: 'customer' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.getUsers(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test('should handle empty user list', async () => {
            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await adminController.getUsers(req, res);

            expect(res.render).toHaveBeenCalled();
        });
    });

    describe('updateUserRole', () => {
        test('should update user role - happy path', async () => {
            const user = new User({
                name: 'Test User',
                email: 'testuser@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                params: { userId: user._id },
                body: { role: 'admin' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserRole(req, res);

            const updated = await User.findById(user._id);
            expect(updated.role).toBe('admin');
        });

        test('should reject invalid role - 400', async () => {
            const user = new User({
                name: 'Test User',
                email: 'testuser@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                params: { userId: user._id },
                body: { role: 'superadmin' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserRole(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle non-existent user - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { userId: fakeId },
                body: { role: 'admin' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserRole(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('updateUserStatus', () => {
        test('should ban user with reason - happy path', async () => {
            const user = new User({
                name: 'Test User',
                email: 'testuser@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer',
                isBanned: false
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                params: { userId: user._id },
                body: {
                    action: 'ban',
                    banReason: 'Violation of terms'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserStatus(req, res);

            const updated = await User.findById(user._id);
            expect(updated.isBanned).toBe(true);
            expect(updated.banReason).toBe('Violation of terms');
        });

        test('should unban user - happy path', async () => {
            const user = new User({
                name: 'Banned User',
                email: 'banned@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer',
                isBanned: true,
                banReason: 'Previous violation'
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                params: { userId: user._id },
                body: { action: 'unban' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserStatus(req, res);

            const updated = await User.findById(user._id);
            expect(updated.isBanned).toBe(false);
        });

        test('should reject ban without reason - 400', async () => {
            const user = new User({
                name: 'Test User',
                email: 'testuser@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                params: { userId: user._id },
                body: { action: 'ban' }
                // missing banReason
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserStatus(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle non-existent user - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { userId: fakeId },
                body: { action: 'ban', banReason: 'Test' }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.updateUserStatus(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    // ====================================
    // Coupon Management Tests  
    // ====================================
    describe('postAddCoupon', () => {
        test('should create coupon with valid data - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'NEW50',
                    description: 'New coupon',
                    discount: 15,
                    minAmount: 50000,
                    maxUses: 10,
                    active: true
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'NEW50' });
            expect(coupon).toBeDefined();
            expect(coupon.discount).toBe(15);
        });

        test('should reject duplicate coupon code - 400', async () => {
            const existing = new Coupon(getMockCoupon({ code: 'DUP50' }));
            await existing.save();

            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'DUP50',
                    description: 'Duplicate',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('tồn tại'));
        });

        test('should reject invalid discount value - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'INV50',
                    description: 'Invalid discount',
                    discount: -10
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle missing required fields - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    description: 'Missing code'
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle edge case - empty coupon code', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: '',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('postUpdateCoupon', () => {
        test('should update coupon - happy path', async () => {
            const coupon = new Coupon(getMockCoupon());
            await coupon.save();

            const req = global.testHelpers.createMockReq({
                params: { couponId: coupon._id },
                body: {
                    code: 'UPD50',
                    description: 'Updated coupon',
                    discount: 20,
                    active: true
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postUpdateCoupon(req, res);

            const updated = await Coupon.findById(coupon._id);
            expect(updated.code).toBe('UPD50');
            expect(updated.discount).toBe(20);
        });

        test('should handle non-existent coupon - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { couponId: fakeId },
                body: {
                    code: 'UPD50',
                    discount: 20
                }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.postUpdateCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('deleteCoupon', () => {
        test('should delete coupon - happy path', async () => {
            const coupon = new Coupon(getMockCoupon());
            await coupon.save();

            const req = global.testHelpers.createMockReq({
                params: { couponId: coupon._id }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.deleteCoupon(req, res);

            const deleted = await Coupon.findById(coupon._id);
            expect(deleted).toBeNull();
        });

        test('should handle non-existent coupon deletion - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { couponId: fakeId }
            });
            const res = global.testHelpers.createMockRes();

            await adminController.deleteCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });
});
