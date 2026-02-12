/**
 * Products Controller Tests
 * Coverage: Product listing, details, reviews, pre-orders, notifications
 */

const mongoose = require('mongoose');
const Product = require('../../models/product');
const User = require('../../models/user');
const PreOrder = require('../../models/preOrder');
const BackInStockNotification = require('../../models/backInStockNotification');
const productsController = require('../../controllers/products');

// Test data factories
const getMockProduct = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Product',
    slug: 'test-product',
    price: 100,
    stock: 10,
    category: 'laptop',
    brand: 'Test Brand',
    description: 'Test description',
    images: ['image1.jpg'],
    specs: {},
    reviews: [],
    averageRating: 0,
    ...overrides
});

const getMockUser = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'customer',
    ...overrides
});

const getMockReview = (overrides = {}) => ({
    user: 'user123',
    rating: 5,
    comment: 'Great product!',
    ...overrides
});

describe('Products Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = global.testHelpers.createMockReq();
        res = global.testHelpers.createMockRes();
    });

    describe('getProducts', () => {
        describe('Happy path', () => {
            it('should return all products with default pagination', async () => {
                await Product.create(getMockProduct());
                await Product.create(getMockProduct({ name: 'Product 2', slug: 'product-2' }));

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'products/index',
                    expect.objectContaining({
                        products: expect.any(Array)
                    })
                );
            });

            it('should filter products by category', async () => {
                await Product.create(getMockProduct({ category: 'laptop' }));
                await Product.create(getMockProduct({ category: 'pc', slug: 'product-2' }));

                req.query = { category: 'laptop' };

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalled();
            });

            it('should sort products by price', async () => {
                await Product.create(getMockProduct({ price: 100 }));
                await Product.create(getMockProduct({ price: 200, slug: 'product-2' }));

                req.query = { sort: 'price_asc' };

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalled();
            });

            it('should handle price range filtering', async () => {
                await Product.create(getMockProduct({ price: 100 }));
                await Product.create(getMockProduct({ price: 500, slug: 'product-2' }));

                req.query = { minPrice: 50, maxPrice: 200 };

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });

        describe('Edge cases', () => {
            it('should return empty array when no products match filters', async () => {
                await Product.create(getMockProduct({ category: 'laptop' }));

                req.query = { category: 'monitor' };

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'products/index',
                    expect.objectContaining({
                        products: []
                    })
                );
            });

            it('should handle pagination correctly', async () => {
                // Create 25 products
                for (let i = 0; i < 25; i++) {
                    await Product.create(getMockProduct({
                        name: `Product ${i}`,
                        slug: `product-${i}`
                    }));
                }

                req.query = { page: 2 };

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalled();
            });

            it('should handle invalid page number', async () => {
                await Product.create(getMockProduct());

                req.query = { page: -1 };

                await productsController.getProducts(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });

        describe('Server errors (500)', () => {
            it('should handle database errors gracefully', async () => {
                jest.spyOn(Product, 'find').mockRejectedValueOnce(new Error('DB Error'));

                await productsController.getProducts(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
            });
        });
    });

    describe('getProductDetail', () => {
        describe('Happy path', () => {
            it('should return product details by slug', async () => {
                const product = await Product.create(getMockProduct());

                req.params = { slug: 'test-product' };

                await productsController.getProductDetail(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'products/detail',
                    expect.objectContaining({
                        product: expect.any(Object)
                    })
                );
            });

            it('should return product with reviews', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({
                    reviews: [{
                        user: user._id,
                        rating: 5,
                        comment: 'Excellent!'
                    }]
                }));

                req.params = { slug: 'test-product' };

                await productsController.getProductDetail(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });

        describe('Not found (404)', () => {
            it('should return 404 for non-existent product', async () => {
                req.params = { slug: 'non-existent-product' };

                await productsController.getProductDetail(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });

        describe('Edge cases', () => {
            it('should handle product with no images', async () => {
                await Product.create(getMockProduct({ images: [] }));

                req.params = { slug: 'test-product' };

                await productsController.getProductDetail(req, res);

                expect(res.render).toHaveBeenCalled();
            });

            it('should handle product with zero stock', async () => {
                await Product.create(getMockProduct({ stock: 0 }));

                req.params = { slug: 'test-product' };

                await productsController.getProductDetail(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });
    });

    describe('postAddReview', () => {
        describe('Happy path', () => {
            it('should add review to product successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { slug: 'test-product' };
                req.body = {
                    rating: 5,
                    comment: 'Great product!'
                };

                await productsController.postAddReview(req, res);

                const updatedProduct = await Product.findById(product._id);
                expect(updatedProduct.reviews.length).toBe(1);
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });

            it('should update average rating after adding review', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { slug: 'test-product' };
                req.body = {
                    rating: 4,
                    comment: 'Good product'
                };

                await productsController.postAddReview(req, res);

                const updatedProduct = await Product.findById(product._id);
                expect(updatedProduct.averageRating).toBeGreaterThan(0);
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject review without rating', async () => {
                const user = await User.create(getMockUser());
                await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { slug: 'test-product' };
                req.body = {
                    comment: 'Great product!'
                };

                await productsController.postAddReview(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            });

            it('should reject rating outside 1-5 range', async () => {
                const user = await User.create(getMockUser());
                await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { slug: 'test-product' };
                req.body = {
                    rating: 6,
                    comment: 'Great product!'
                };

                await productsController.postAddReview(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            });

            it('should reject duplicate review from same user', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({
                    reviews: [{
                        user: user._id,
                        rating: 5,
                        comment: 'First review'
                    }]
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { slug: 'test-product' };
                req.body = {
                    rating: 4,
                    comment: 'Second review'
                };

                await productsController.postAddReview(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('đã đánh giá'));
            });
        });

        describe('Authentication errors (401)', () => {
            it('should reject review from unauthenticated user', async () => {
                await Product.create(getMockProduct());

                req.isAuthenticated = jest.fn(() => false);
                req.params = { slug: 'test-product' };
                req.body = {
                    rating: 5,
                    comment: 'Great!'
                };

                await productsController.postAddReview(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            });
        });

        describe('Not found (404)', () => {
            it('should reject review for non-existent product', async () => {
                const user = await User.create(getMockUser());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { slug: 'non-existent' };
                req.body = {
                    rating: 5,
                    comment: 'Great!'
                };

                await productsController.postAddReview(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không tìm thấy'));
            });
        });
    });

    describe('createPreOrder', () => {
        describe('Happy path', () => {
            it('should create pre-order successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 1,
                    email: 'test@example.com',
                    phone: '1234567890'
                };

                await productsController.createPreOrder(req, res);

                const preOrder = await PreOrder.findOne({ product: product._id });
                expect(preOrder).toBeTruthy();
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject pre-order for in-stock product', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 10 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 1
                };

                await productsController.createPreOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('còn hàng'));
            });

            it('should reject pre-order with invalid quantity', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 0
                };

                await productsController.createPreOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            });

            it('should reject duplicate pre-order', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));

                await PreOrder.create({
                    product: product._id,
                    user: user._id,
                    quantity: 1,
                    contactEmail: user.email,
                    priceAtOrder: product.price,
                    status: 'pending'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 1
                };

                await productsController.createPreOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('đã đặt trước'));
            });
        });
    });

    describe('cancelPreOrder', () => {
        describe('Happy path', () => {
            it('should cancel pre-order successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));
                const preOrder = await PreOrder.create({
                    product: product._id,
                    user: user._id,
                    quantity: 1,
                    contactEmail: user.email,
                    priceAtOrder: product.price,
                    status: 'pending'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { preOrderId: preOrder._id.toString() };

                await productsController.cancelPreOrder(req, res);

                const updatedPreOrder = await PreOrder.findById(preOrder._id);
                expect(updatedPreOrder.status).toBe('cancelled');
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject cancelling other user pre-order', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'other@example.com' }));
                const product = await Product.create(getMockProduct({ stock: 0 }));
                const preOrder = await PreOrder.create({
                    product: product._id,
                    user: user2._id,
                    quantity: 1,
                    contactEmail: user2.email,
                    priceAtOrder: product.price,
                    status: 'pending'
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { preOrderId: preOrder._id.toString() };

                await productsController.cancelPreOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không có quyền'));
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject cancelling already fulfilled pre-order', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));
                const preOrder = await PreOrder.create({
                    product: product._id,
                    user: user._id,
                    quantity: 1,
                    contactEmail: user.email,
                    priceAtOrder: product.price,
                    status: 'converted'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { preOrderId: preOrder._id.toString() };

                await productsController.cancelPreOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không thể hủy'));
            });
        });
    });

    describe('subscribeNotification', () => {
        describe('Happy path', () => {
            it('should subscribe to back-in-stock notification', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    email: 'test@example.com'
                };

                await productsController.subscribeNotification(req, res);

                const notification = await BackInStockNotification.findOne({
                    product: product._id,
                    user: user._id
                });
                expect(notification).toBeTruthy();
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject subscription for in-stock product', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 10 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    email: user.email
                };

                await productsController.subscribeNotification(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('còn hàng'));
            });

            it('should reject duplicate subscription', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));

                await BackInStockNotification.create({
                    product: product._id,
                    user: user._id,
                    email: user.email,
                    notified: false
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    email: user.email
                };

                await productsController.subscribeNotification(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('đã đăng ký'));
            });
        });
    });

    describe('unsubscribeNotification', () => {
        describe('Happy path', () => {
            it('should unsubscribe from notification successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));
                const notification = await BackInStockNotification.create({
                    product: product._id,
                    user: user._id,
                    email: user.email,
                    notified: false
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { notificationId: notification._id.toString() };

                await productsController.unsubscribeNotification(req, res);

                const deletedNotification = await BackInStockNotification.findById(notification._id);
                expect(deletedNotification).toBeNull();
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject unsubscribing other user notification', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'other@example.com' }));
                const product = await Product.create(getMockProduct({ stock: 0 }));
                const notification = await BackInStockNotification.create({
                    product: product._id,
                    user: user2._id,
                    email: user2.email,
                    notified: false
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { notificationId: notification._id.toString() };

                await productsController.unsubscribeNotification(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không có quyền'));
            });
        });
    });

    describe('getUserPreOrders', () => {
        describe('Happy path', () => {
            it('should return user pre-orders', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));
                await PreOrder.create({
                    product: product._id,
                    user: user._id,
                    quantity: 1,
                    contactEmail: user.email,
                    priceAtOrder: product.price,
                    status: 'pending'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await productsController.getUserPreOrders(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/pre-orders',
                    expect.objectContaining({
                        preOrders: expect.any(Array)
                    })
                );
            });

            it('should return empty array when no pre-orders', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await productsController.getUserPreOrders(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/pre-orders',
                    expect.objectContaining({
                        preOrders: []
                    })
                );
            });
        });
    });

    describe('getUserNotifications', () => {
        describe('Happy path', () => {
            it('should return user notifications', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));
                await BackInStockNotification.create({
                    product: product._id,
                    user: user._id,
                    email: user.email,
                    notified: false
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await productsController.getUserNotifications(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/notifications',
                    expect.objectContaining({
                        notifications: expect.any(Array)
                    })
                );
            });
        });

        describe('Edge cases', () => {
            it('should return empty array when no notifications', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await productsController.getUserNotifications(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/notifications',
                    expect.objectContaining({
                        notifications: []
                    })
                );
            });
        });
    });
});
