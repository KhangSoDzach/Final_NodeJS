/**
 * Order Controller Tests
 * Comprehensive tests for order creation, tracking, checkout, and invoice functionality
 */

const mongoose = require('mongoose');
const Order = require('../../models/order');
const Cart = require('../../models/cart');
const User = require('../../models/user');
const Product = require('../../models/product');
const orderController = require('../../controllers/order');
const bcrypt = require('bcryptjs');

// Mock email service
// Mock email service
jest.mock('../../utils/emailService', () => ({
    sendOrderConfirmation: jest.fn(),
    sendOrderConfirmationEmail: jest.fn(),
    sendEmail: jest.fn()
}));

// Mock invoice generator
jest.mock('../../utils/invoiceGenerator', () => ({
    generateInvoice: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
    generateInvoiceHTML: jest.fn().mockReturnValue('<html>Invoice</html>'),
    generateInvoicePDF: jest.fn().mockResolvedValue(Buffer.from('fake-pdf'))
}));

describe('Order Controller', () => {
    // Factory functions
    const getMockUser = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'hashedpassword',
        role: 'customer',
        loyaltyPoints: 0,
        ...overrides
    });

    const getMockProduct = (overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100000,
        stock: 10,
        category: 'CPU',
        brand: 'Intel',
        ...overrides
    });

    const getMockCart = (user, product, overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        user: user._id,
        items: [{
            product: product._id,
            quantity: 2,
            price: product.price
        }],
        ...overrides
    });

    const getMockOrder = (user, overrides = {}) => ({
        _id: new mongoose.Types.ObjectId(),
        orderNumber: 'ORD-' + Date.now(),
        user: user._id,
        items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 100000,
            name: 'Test Product'
        }],
        total: 100000,
        status: 'pending',
        shippingAddress: {
            fullName: 'Test User',
            phone: '0123456789',
            address: '123 Test St',
            city: 'Test City',
            district: 'Test District',
            ward: 'Test Ward'
        },
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ====================================
    // Checkout Tests
    // ====================================
    describe('getCheckout', () => {
        test('should render checkout page with cart items - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const product = new Product(getMockProduct());
            await product.save();

            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                isAuthenticated: jest.fn(() => true)
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getCheckout(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'orders/checkout',
                expect.objectContaining({
                    title: expect.any(String)
                })
            );
        });

        test('should redirect if cart is empty', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                isAuthenticated: jest.fn(() => true)
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getCheckout(req, res);

            expect(res.redirect).toHaveBeenCalled();
        });

        test('should require authentication - 401', async () => {
            const req = global.testHelpers.createMockReq({
                isAuthenticated: jest.fn(() => false)
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getCheckout(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        });
    });

    describe('postCheckout', () => {
        test('should create order from cart - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const product = new Product(getMockProduct({ stock: 100 }));
            await product.save();

            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    shippingAddress: {
                        fullName: 'Test User',
                        phone: '0123456789',
                        address: '123 Test St',
                        city: 'Test City',
                        district: 'Test District',
                        ward: 'Test Ward'
                    },
                    paymentMethod: 'COD'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postCheckout(req, res);

            const orders = await Order.find({ user: user._id });
            expect(orders.length).toBeGreaterThan(0);
        });

        test('should reject checkout with insufficient stock - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const product = new Product(getMockProduct({ stock: 1 }));
            await product.save();

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: product._id,
                    quantity: 10, // More than available stock
                    price: product.price
                }]
            });
            await cart.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    shippingAddress: {
                        fullName: 'Test User',
                        phone: '0123456789',
                        address: '123 Test St',
                        city: 'Test City'
                    },
                    paymentMethod: 'COD'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postCheckout(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should validate shipping address - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    shippingAddress: {
                        // Missing required fields
                        fullName: 'Test User'
                    },
                    paymentMethod: 'COD'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postCheckout(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle empty cart checkout - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    shippingAddress: {
                        fullName: 'Test User',
                        phone: '0123456789',
                        address: '123 Test St',
                        city: 'Test City'
                    }
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postCheckout(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('postGuestCheckout', () => {
        test('should create order for guest user - happy path', async () => {
            const product = new Product(getMockProduct({ stock: 100 }));
            await product.save();

            const cart = new Cart({
                sessionId: 'guest-session-123',
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: product.price
                }]
            });
            await cart.save();

            const req = global.testHelpers.createMockReq({
                session: {
                    cartId: 'guest-session-123'
                },
                body: {
                    email: 'guest@example.com',
                    shippingAddress: {
                        fullName: 'Guest User',
                        phone: '0123456789',
                        address: '123 Guest St',
                        city: 'Guest City',
                        district: 'Guest District',
                        ward: 'Guest Ward'
                    },
                    paymentMethod: 'COD'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postGuestCheckout(req, res);

            const orders = await Order.find({ 'guestInfo.email': 'guest@example.com' });
            expect(orders.length).toBeGreaterThan(0);
        });

        test('should require valid email - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    email: 'invalid-email',
                    shippingAddress: {
                        fullName: 'Guest User'
                    }
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postGuestCheckout(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle missing guest session - 400', async () => {
            const req = global.testHelpers.createMockReq({
                session: {},
                body: {
                    email: 'guest@example.com',
                    shippingAddress: {
                        fullName: 'Guest User',
                        phone: '0123456789',
                        address: '123 Guest St'
                    }
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.postGuestCheckout(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('oneClickCheckout', () => {
        test('should create order with default address - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12),
                defaultAddress: {
                    fullName: 'Test User',
                    phone: '0123456789',
                    address: '123 Default St',
                    city: 'Default City',
                    district: 'Default District',
                    ward: 'Default Ward'
                }
            });
            await user.save();

            const product = new Product(getMockProduct({ stock: 100 }));
            await product.save();

            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    paymentMethod: 'COD'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.oneClickCheckout(req, res);

            const orders = await Order.find({ user: user._id });
            expect(orders.length).toBeGreaterThan(0);
        });

        test('should fail if no default address - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
                // No defaultAddress
            });
            await user.save();

            // Create product and cart so controller reaches the default address check
            const product = new Product(getMockProduct({ stock: 100 }));
            await product.save();

            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    paymentMethod: 'COD'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.oneClickCheckout(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    // ====================================
    // Order Tracking Tests
    // ====================================
    describe('trackOrder', () => {
        test('should display order tracking - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order(getMockOrder(user));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderNumber: order.orderNumber },
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.trackOrder(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'orders/track',
                expect.objectContaining({
                    order: expect.any(Object)
                })
            );
        });

        test('should handle non-existent order - 404', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                params: { orderNumber: 'FAKE-ORDER' },
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.trackOrder(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should prevent tracking other user orders - 403', async () => {
            const user1 = new User({
                name: 'User 1',
                email: 'user1@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user1.save();

            const user2 = new User({
                name: 'User 2',
                email: 'user2@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user2.save();

            const order = new Order(getMockOrder(user1));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderNumber: order.orderNumber },
                user: user2 // Different user trying to track
            });
            const res = global.testHelpers.createMockRes();

            await orderController.trackOrder(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('trackGuestOrder', () => {
        test('should track guest order with email verification - happy path', async () => {
            const order = new Order({
                ...getMockOrder({ _id: new mongoose.Types.ObjectId() }),
                user: null,
                isGuestOrder: true,
                guestInfo: {
                    email: 'guest@example.com',
                    guestToken: 'guest-token'
                }
            });
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderNumber: '', token: 'guest-token' },
                query: { email: 'guest@example.com', token: 'guest-token' }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.trackGuestOrder(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'orders/track',
                expect.objectContaining({
                    order: expect.any(Object)
                })
            );
        });

        test('should reject wrong email for guest order - 403', async () => {
            const order = new Order({
                ...getMockOrder({ _id: new mongoose.Types.ObjectId() }),
                user: null,
                isGuestOrder: true,
                guestInfo: {
                    email: 'guest@example.com'
                }
            });
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderNumber: order.orderNumber },
                query: { email: 'wrong@example.com' }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.trackGuestOrder(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should require email parameter - 400', async () => {
            const order = new Order({
                ...getMockOrder({ _id: new mongoose.Types.ObjectId() }),
                user: null,
                guestEmail: 'guest@example.com'
            });
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderNumber: order.orderNumber },
                query: {} // Missing email
            });
            const res = global.testHelpers.createMockRes();

            await orderController.trackGuestOrder(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    // ====================================
    // Order History Tests
    // ====================================
    describe('getOrderHistory', () => {
        test('should display user order history - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order1 = new Order(getMockOrder(user));
            await order1.save();

            const order2 = new Order(getMockOrder(user));
            await order2.save();

            const req = global.testHelpers.createMockReq({
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getOrderHistory(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'orders/history',
                expect.objectContaining({
                    orders: expect.any(Array)
                })
            );
        });

        test('should handle empty order history', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getOrderHistory(req, res);

            expect(res.render).toHaveBeenCalled();
        });
    });

    // ====================================
    // Loyalty Points Tests
    // ====================================
    describe('applyLoyaltyPoints', () => {
        test('should apply loyalty points to order - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: 1000
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    pointsToUse: 500
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.applyLoyaltyPoints(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: expect.any(Boolean)
                })
            );
        });

        test('should reject using more points than available - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: 100
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    pointsToUse: 500 // More than available
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.applyLoyaltyPoints(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false
                })
            );
        });

        test('should reject negative points - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: 1000
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user,
                body: {
                    pointsToUse: -100
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.applyLoyaltyPoints(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false
                })
            );
        });
    });

    // ====================================
    // Invoice Tests
    // ====================================
    describe('getInvoice', () => {
        test('should display invoice - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order(getMockOrder(user));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getInvoice(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'orders/invoice',
                expect.objectContaining({
                    order: expect.any(Object)
                })
            );
        });

        test('should handle non-existent invoice - 404', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { orderId: fakeId },
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getInvoice(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should prevent viewing other user invoices - 403', async () => {
            const user1 = new User({
                name: 'User 1',
                email: 'user1@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user1.save();

            const user2 = new User({
                name: 'User 2',
                email: 'user2@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user2.save();

            const order = new Order(getMockOrder(user1));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user2 // Different user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getInvoice(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });
    });

    describe('downloadInvoicePDF', () => {
        test('should download invoice PDF - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order(getMockOrder(user));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user
            });
            const res = {
                ...global.testHelpers.createMockRes(),
                setHeader: jest.fn(),
                send: jest.fn()
            };

            await orderController.downloadInvoicePDF(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        });

        test('should handle PDF generation error - 500', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order(getMockOrder(user));
            await order.save();

            // Mock invoice generator to throw error
            const invoiceGenerator = require('../../utils/invoiceGenerator');
            invoiceGenerator.generateInvoice.mockRejectedValueOnce(new Error('PDF Generation Failed'));

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.downloadInvoicePDF(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
    });

    describe('requestVatInvoice', () => {
        test('should request VAT invoice with company info - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order(getMockOrder(user, {
                totalAmount: 300000 // > 200,000 for VAT
            }));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user,
                body: {
                    companyName: 'Test Company',
                    taxCode: '0123456789',
                    companyAddress: '123 Company St'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.requestVatInvoice(req, res);

            const updated = await Order.findById(order._id);
            expect(updated.vatInvoice).toBe(true);
        });

        test('should validate tax code format - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order(getMockOrder(user));
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user,
                body: {
                    companyName: 'Test Company',
                    taxCode: 'invalid',
                    companyAddress: '123 Company St'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.requestVatInvoice(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });

        test('should reject duplicate VAT invoice request - 400', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const order = new Order({
                ...getMockOrder(user),
                vatInvoiceRequested: true
            });
            await order.save();

            const req = global.testHelpers.createMockReq({
                params: { orderId: order._id },
                user: user,
                body: {
                    companyName: 'Test Company',
                    taxCode: '0123456789',
                    companyAddress: '123 Company St'
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.requestVatInvoice(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
    });

    describe('calculateVatPreview', () => {
        test('should calculate VAT breakdown - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    total: 100000
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.calculateVatPreview(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: expect.any(Boolean)
                })
            );
        });

        test('should handle invalid total amount - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    total: -100
                }
            });
            const res = global.testHelpers.createMockRes();

            await orderController.calculateVatPreview(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false
                })
            );
        });
    });

    describe('getUserAddresses', () => {
        test('should return user saved addresses - happy path', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12),
                savedAddresses: [
                    {
                        fullName: 'Address 1',
                        phone: '0123456789',
                        address: '123 St',
                        city: 'City 1'
                    },
                    {
                        fullName: 'Address 2',
                        phone: '0987654321',
                        address: '456 St',
                        city: 'City 2'
                    }
                ]
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getUserAddresses(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    addresses: expect.any(Array)
                })
            );
        });

        test('should handle user with no saved addresses', async () => {
            const user = new User({
                ...getMockUser(),
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const req = global.testHelpers.createMockReq({
                user: user
            });
            const res = global.testHelpers.createMockRes();

            await orderController.getUserAddresses(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    addresses: []
                })
            );
        });
    });
});
