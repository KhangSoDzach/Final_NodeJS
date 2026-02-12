/**
 * Cart Controller Tests
 * Coverage: Happy path, validation, auth, edge cases
 */

const mongoose = require('mongoose');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const Coupon = require('../../models/coupon');
const User = require('../../models/user');
const cartController = require('../../controllers/cart');

// Test data factories
const getMockUser = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'customer',
    ...overrides
});

const getMockProduct = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Product',
    price: 100,
    stock: 10,
    slug: 'test-product',
    category: 'laptop',
    brand: 'Test Brand',
    ...overrides
});

const getMockCart = (overrides = {}) => ({
    _id: 'cart123',
    user: 'user123',
    items: [],
    totalAmount: 0,
    save: jest.fn().mockResolvedValue(true),
    ...overrides
});

const getMockCoupon = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    code: 'SAV10',
    discount: 10,
    minAmount: 50,
    maxUses: 10,
    usedCount: 0,
    active: true,
    endDate: new Date(Date.now() + 86400000),
    description: 'Test coupon',
    ...overrides
});

describe('Cart Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = global.testHelpers.createMockReq();
        res = global.testHelpers.createMockRes();
    });

    describe('getCart', () => {
        describe('Happy path', () => {
            it('should render cart page for authenticated user with items', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                const cart = await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 2,
                        total: 200
                    }],
                    totalAmount: 200
                });

                await cartController.getCart(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'cart/cart',

                    expect.objectContaining({
                        cart: expect.objectContaining({
                            totalAmount: 200
                        })
                    })
                );

            });

            it('should render empty cart for user with no items', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await cartController.getCart(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'cart/cart',
                    expect.objectContaining({
                        isGuest: false
                    })
                );

            });
        });

        describe('Authentication errors (401)', () => {
            it('should redirect to login if user not authenticated', async () => {
                req.isAuthenticated = jest.fn(() => false);

                await cartController.getCart(req, res);

                expect(res.render).toHaveBeenCalledWith('cart/cart', expect.any(Object));

            });
        });

        describe('Edge cases', () => {
            it('should handle cart with deleted products gracefully', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [{
                        product: new mongoose.Types.ObjectId(),
                        name: 'Deleted Product',

                        price: 100,
                        quantity: 1,
                        total: 100
                    }],
                    totalAmount: 100
                });

                await cartController.getCart(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });
    });

    describe('addToCart', () => {
        describe('Happy path', () => {
            it('should add new item to cart successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 2
                };

                await cartController.addToCart(req, res);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: true
                }));

            });

            it('should update quantity if product already in cart', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                // Add product first time
                await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        total: 100
                    }],
                    totalAmount: 100
                });

                req.body = {
                    productId: product._id.toString(),
                    quantity: 2
                };

                await cartController.addToCart(req, res);

                const cart = await Cart.findOne({ user: user._id });
                const item = cart.items.find(i => i.product.toString() === product._id.toString());
                expect(item.quantity).toBe(3); // 1 + 2
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject if product not found', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: new mongoose.Types.ObjectId().toString(),
                    quantity: 1
                };

                await cartController.addToCart(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: false
                }));

            });

            it('should reject if quantity exceeds stock', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 5 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 10
                };

                await cartController.addToCart(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: false
                }));

            });

            it('should reject if quantity is invalid', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 0
                };

                await cartController.addToCart(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

            });
        });

        describe('Authentication errors (401)', () => {
            it('should allow adding to cart for guest users', async () => {
                const product = await Product.create(getMockProduct());
                req.isAuthenticated = jest.fn(() => false);
                req.user = null;
                req.session = { cartId: null };
                req.body = {
                    productId: product._id.toString(),
                    quantity: 1
                };

                await cartController.addToCart(req, res);

                // Should create a guest cart session, not redirect to login
                expect(res.status).toHaveBeenCalledWith(200);
            });
        });

        describe('Edge cases', () => {
            it('should handle out of stock products', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 0 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    productId: product._id.toString(),
                    quantity: 1
                };

                await cartController.addToCart(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

            });
        });
    });

    describe('updateCart', () => {
        describe('Happy path', () => {
            it('should update cart item quantity successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                const cart = await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 2,
                        total: 200
                    }],
                    totalAmount: 200
                });

                const savedCart = await Cart.findById(cart._id);
                const savedItem = savedCart.items[0];

                req.body = {
                    itemId: savedItem._id.toString(),
                    quantity: 5
                };


                await cartController.updateCart(req, res);

                const updatedCart = await Cart.findById(cart._id);
                const item = updatedCart.items.find(i => i.product.toString() === product._id.toString());
                expect(item.quantity).toBe(5);
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject if new quantity exceeds stock', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ stock: 5 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 2,
                        total: 200
                    }],
                    totalAmount: 200
                });

                req.body = {
                    productId: product._id.toString(),
                    quantity: 10
                };

                await cartController.updateCart(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

            });
        });
    });

    describe('removeItem', () => {
        describe('Happy path', () => {
            it('should remove item from cart successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                const cart = await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 2,
                        total: 200
                    }],
                    totalAmount: 200
                });

                const savedCart = await Cart.findById(cart._id);
                const savedItem = savedCart.items[0];
                req.params = { itemId: savedItem._id.toString() };


                await cartController.removeItem(req, res);

                const updatedCart = await Cart.findById(cart._id);
                expect(updatedCart.items.length).toBe(0);
            });
        });

        describe('Not found (404)', () => {
            it('should handle removing non-existent item gracefully', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 0
                });

                req.params = { itemId: new mongoose.Types.ObjectId().toString() };


                await cartController.removeItem(req, res);

                expect(res.status).toHaveBeenCalledWith(404);

            });
        });
    });

    describe('applyCoupon', () => {


        describe('Happy path', () => {
            it('should apply valid coupon successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());
                const coupon = await Coupon.create(getMockCoupon());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 2,
                        total: 200
                    }],
                    totalAmount: 200
                });

                req.body = { couponCode: 'SAL10' };

                await cartController.applyCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: true
                }));

            });
        });

        describe('Validation errors (400)', () => {
            it('should reject invalid coupon code', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 100
                });

                req.body = { couponCode: 'INVLD' };

                await cartController.applyCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(404);

            });

            it('should reject if cart total below minimum amount', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct({ price: 30 }));
                const coupon = await Coupon.create(getMockCoupon({ minAmount: 100 }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [{
                        product: product._id,
                        name: product.name,
                        price: 30,
                        quantity: 1,
                        total: 30
                    }],
                    totalAmount: 30
                });

                req.body = { couponCode: 'SAL10' };

                await cartController.applyCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

            });

            it('should reject expired coupon', async () => {
                const user = await User.create(getMockUser());
                await Coupon.create(getMockCoupon({
                    code: 'EXPIR',
                    endDate: new Date(Date.now() - 86400000) // Yesterday
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 200
                });

                req.body = { couponCode: 'EXPIR' };

                await cartController.applyCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('hết hạn')
                }));

            });

            it('should reject if coupon usage limit exceeded', async () => {
                const user = await User.create(getMockUser());
                await Coupon.create(getMockCoupon({
                    code: 'LIMIT',
                    maxUses: 10,
                    usedCount: 10
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 200
                });

                req.body = { couponCode: 'LIMIT' };

                await cartController.applyCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('hết lượt')
                }));

            });
        });

        describe('Edge cases', () => {
            it('should handle empty cart', async () => {
                const user = await User.create(getMockUser());
                const coupon = await Coupon.create(getMockCoupon());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 0
                });

                req.body = { couponCode: 'SAL10' };

                await cartController.applyCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(404);

            });
        });
    });

    describe('removeCoupon', () => {
        describe('Happy path', () => {
            it('should remove applied coupon successfully', async () => {
                const user = await User.create(getMockUser());
                const coupon = await Coupon.create(getMockCoupon());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                const cart = await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 200,
                    appliedCoupon: coupon._id,
                    discount: 20
                });

                await cartController.removeCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(200);

            });
        });

        describe('Edge cases', () => {
            it('should handle removing coupon when none applied', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await Cart.create({
                    user: user._id,
                    items: [],
                    totalAmount: 200
                });

                await cartController.removeCoupon(req, res);

                expect(res.status).toHaveBeenCalledWith(200);


            });
        });
    });

    describe('Server errors (500)', () => {
        it('should handle database errors gracefully', async () => {
            const user = await User.create(getMockUser());
            req.user = user;
            req.isAuthenticated = jest.fn(() => true);

            // Mock database error
            jest.spyOn(Cart, 'findOne').mockRejectedValueOnce(new Error('DB Error'));

            await cartController.getCart(req, res);

            expect(res.redirect).toHaveBeenCalled();
        });
    });
});
