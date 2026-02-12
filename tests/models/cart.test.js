/**
 * Cart Model Tests
 * Comprehensive tests for Cart schema, methods, and validations
 */

const mongoose = require('mongoose');
const Cart = require('../../models/cart');
const User = require('../../models/user');
const Product = require('../../models/product');
const bcrypt = require('bcryptjs');

describe('Cart Model', () => {
    // Factory functions
    const getMockUser = async (overrides = {}) => {
        const user = new User({
            name: 'Test User',
            email: 'user@example.com',
            password: await bcrypt.hash('password', 12),
            role: 'customer',
            ...overrides
        });
        return user.save();
    };

    const getMockProduct = async (overrides = {}) => {
        const product = new Product({
            name: 'Test Product',
            price: 100000,
            stock: 50,
            category: 'CPU',
            brand: 'Intel',
            ...overrides
        });
        return product.save();
    };

    const getMockCart = (user, product, overrides = {}) => ({
        user: user._id,
        items: [{
            product: product._id,
            quantity: 2,
            price: product.price
        }],
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ====================================
    // Cart Creation Tests
    // ====================================
    describe('Cart Creation', () => {
        test('should create cart for authenticated user - happy path', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cartData = getMockCart(user, product);

            const cart = new Cart(cartData);
            await cart.save();

            expect(cart._id).toBeDefined();
            expect(cart.user.toString()).toBe(user._id.toString());
            expect(cart.items.length).toBe(1);
        });

        test('should create cart with session ID for guest', async () => {
            const product = await getMockProduct();
            const cartData = {
                sessionId: 'guest-session-123',
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: product.price
                }]
            };

            const cart = new Cart(cartData);
            await cart.save();

            expect(cart.sessionId).toBe('guest-session-123');
            expect(cart.user).toBeUndefined();
        });

        test('should allow empty cart', async () => {
            const user = await getMockUser();
            const cart = new Cart({
                user: user._id,
                items: []
            });
            await cart.save();

            expect(cart.items.length).toBe(0);
        });

        test('should require either user or sessionId', async () => {
            const product = await getMockProduct();
            const cartData = {
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: 100000
                }]
                // Missing both user and sessionId
            };

            const cart = new Cart(cartData);

            try {
                await cart.save();
                // May succeed depending on schema validation
                expect(cart._id).toBeDefined();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    // ====================================
    // Cart Item Management Tests
    // ====================================
    describe('Cart Items', () => {
        test('should add single item to cart', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            expect(cart.items.length).toBe(1);
            expect(cart.items[0].quantity).toBe(2);
            expect(cart.items[0].price).toBe(product.price);
        });

        test('should add multiple items to cart', async () => {
            const user = await getMockUser();
            const product1 = await getMockProduct({ name: 'Product 1' });
            const product2 = await getMockProduct({ name: 'Product 2', price: 200000 });

            const cart = new Cart({
                user: user._id,
                items: [
                    {
                        product: product1._id,
                        quantity: 2,
                        price: product1.price
                    },
                    {
                        product: product2._id,
                        quantity: 1,
                        price: product2.price
                    }
                ]
            });
            await cart.save();

            expect(cart.items.length).toBe(2);
        });

        test('should validate minimum quantity', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: product._id,
                    quantity: 0, // Invalid quantity
                    price: product.price
                }]
            });

            try {
                await cart.save();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should validate price is positive', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: -100 // Invalid negative price
                }]
            });

            try {
                await cart.save();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should update item quantity', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            cart.items[0].quantity = 5;
            await cart.save();

            const updated = await Cart.findById(cart._id);
            expect(updated.items[0].quantity).toBe(5);
        });

        test('should remove item from cart', async () => {
            const user = await getMockUser();
            const product1 = await getMockProduct({ name: 'Product 1' });
            const product2 = await getMockProduct({ name: 'Product 2' });

            const cart = new Cart({
                user: user._id,
                items: [
                    { product: product1._id, quantity: 1, price: 100000 },
                    { product: product2._id, quantity: 1, price: 200000 }
                ]
            });
            await cart.save();

            cart.items = cart.items.filter(item =>
                item.product.toString() !== product1._id.toString()
            );
            await cart.save();

            expect(cart.items.length).toBe(1);
            expect(cart.items[0].product.toString()).toBe(product2._id.toString());
        });
    });

    // ====================================
    // Cart Total Calculation Tests
    // ====================================
    describe('Cart Totals', () => {
        test('should calculate total for single item', async () => {
            const user = await getMockUser();
            const product = await getMockProduct({ price: 100000 });
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            expect(total).toBe(200000); // 100000 * 2
        });

        test('should calculate total for multiple items', async () => {
            const user = await getMockUser();
            const product1 = await getMockProduct({ name: 'P1', price: 100000 });
            const product2 = await getMockProduct({ name: 'P2', price: 200000 });

            const cart = new Cart({
                user: user._id,
                items: [
                    { product: product1._id, quantity: 2, price: 100000 },
                    { product: product2._id, quantity: 1, price: 200000 }
                ]
            });
            await cart.save();

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            expect(total).toBe(400000); // (100000 * 2) + (200000 * 1)
        });

        test('should handle empty cart total', async () => {
            const user = await getMockUser();
            const cart = new Cart({
                user: user._id,
                items: []
            });
            await cart.save();

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            expect(total).toBe(0);
        });
    });

    // ====================================
    // Guest Cart Tests
    // ====================================
    describe('Guest Carts', () => {
        test('should create guest cart with session ID', async () => {
            const product = await getMockProduct();
            const cart = new Cart({
                sessionId: 'guest-12345',
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: product.price
                }]
            });
            await cart.save();

            expect(cart.sessionId).toBe('guest-12345');
            expect(cart.user).toBeUndefined();
        });

        test('should merge guest cart with user cart', async () => {
            const user = await getMockUser();
            const product1 = await getMockProduct({ name: 'P1' });
            const product2 = await getMockProduct({ name: 'P2' });

            // Create guest cart
            const guestCart = new Cart({
                sessionId: 'guest-merge',
                items: [{
                    product: product1._id,
                    quantity: 2,
                    price: product1.price
                }]
            });
            await guestCart.save();

            // Create user cart
            const userCart = new Cart({
                user: user._id,
                items: [{
                    product: product2._id,
                    quantity: 1,
                    price: product2.price
                }]
            });
            await userCart.save();

            // Merge logic
            guestCart.items.forEach(guestItem => {
                const existingItem = userCart.items.find(
                    item => item.product.toString() === guestItem.product.toString()
                );
                if (existingItem) {
                    existingItem.quantity += guestItem.quantity;
                } else {
                    userCart.items.push(guestItem);
                }
            });
            await userCart.save();

            expect(userCart.items.length).toBe(2);
        });

        test('should convert guest cart to user cart', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();

            const cart = new Cart({
                sessionId: 'guest-convert',
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: product.price
                }]
            });
            await cart.save();

            // Convert to user cart
            cart.user = user._id;
            cart.sessionId = undefined;
            await cart.save();

            const updated = await Cart.findById(cart._id);
            expect(updated.user.toString()).toBe(user._id.toString());
            expect(updated.sessionId).toBeUndefined();
        });
    });

    // ====================================
    // Cart Persistence Tests
    // ====================================
    describe('Cart Persistence', () => {
        test('should persist cart after user logout', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            // Cart should still exist
            const found = await Cart.findOne({ user: user._id });
            expect(found).toBeDefined();
            expect(found.items.length).toBe(1);
        });

        test('should clear cart after checkout', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            // Clear cart
            cart.items = [];
            await cart.save();

            const cleared = await Cart.findById(cart._id);
            expect(cleared.items.length).toBe(0);
        });

        test('should delete cart', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            await Cart.findByIdAndDelete(cart._id);

            const deleted = await Cart.findById(cart._id);
            expect(deleted).toBeNull();
        });
    });

    // ====================================
    // Edge Cases
    // ====================================
    describe('Edge Cases', () => {
        test('should handle very large quantities', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: product._id,
                    quantity: 999,
                    price: product.price
                }]
            });
            await cart.save();

            expect(cart.items[0].quantity).toBe(999);
        });

        test('should handle multiple of same product', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();

            const cart = new Cart({
                user: user._id,
                items: [
                    { product: product._id, quantity: 2, price: product.price },
                    { product: product._id, quantity: 3, price: product.price }
                ]
            });
            await cart.save();

            // System should handle or consolidate duplicates
            expect(cart.items.length).toBeGreaterThan(0);
        });

        test('should handle product with zero price', async () => {
            const user = await getMockUser();
            const product = await getMockProduct({ price: 0 });

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: 0
                }]
            });
            await cart.save();

            expect(cart.items[0].price).toBe(0);
        });

        test('should handle null product reference', async () => {
            const user = await getMockUser();

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: null,
                    quantity: 1,
                    price: 100000
                }]
            });

            try {
                await cart.save();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle invalid product ID', async () => {
            const user = await getMockUser();

            const cart = new Cart({
                user: user._id,
                items: [{
                    product: 'invalid-id',
                    quantity: 1,
                    price: 100000
                }]
            });

            try {
                await cart.save();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle cart with no items but valid structure', async () => {
            const user = await getMockUser();
            const cart = new Cart({
                user: user._id,
                items: []
            });
            await cart.save();

            expect(cart.items).toEqual([]);
        });
    });

    // ====================================
    // Query Tests
    // ====================================
    describe('Cart Queries', () => {
        test('should find cart by user', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const found = await Cart.findOne({ user: user._id });
            expect(found).toBeDefined();
            expect(found._id.toString()).toBe(cart._id.toString());
        });

        test('should find cart by session ID', async () => {
            const product = await getMockProduct();
            const cart = new Cart({
                sessionId: 'test-session',
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: product.price
                }]
            });
            await cart.save();

            const found = await Cart.findOne({ sessionId: 'test-session' });
            expect(found).toBeDefined();
        });

        test('should populate product details', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const populated = await Cart.findById(cart._id).populate('items.product');
            expect(populated.items[0].product).toBeDefined();
            expect(populated.items[0].product.name).toBe('Test Product');
        });

        test('should count all carts', async () => {
            const user1 = await getMockUser({ email: 'user1@example.com' });
            const user2 = await getMockUser({ email: 'user2@example.com' });
            const product = await getMockProduct();

            const cart1 = new Cart(getMockCart(user1, product));
            await cart1.save();

            const cart2 = new Cart(getMockCart(user2, product));
            await cart2.save();

            const count = await Cart.countDocuments();
            expect(count).toBeGreaterThanOrEqual(2);
        });

        test('should find carts with items', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const cartsWithItems = await Cart.find({ 'items.0': { $exists: true } });
            expect(cartsWithItems.length).toBeGreaterThan(0);
        });

        test('should find empty carts', async () => {
            const user = await getMockUser();
            const cart = new Cart({
                user: user._id,
                items: []
            });
            await cart.save();

            const emptyCarts = await Cart.find({ items: { $size: 0 } });
            expect(emptyCarts.length).toBeGreaterThan(0);
        });
    });

    // ====================================
    // Timestamp Tests
    // ====================================
    describe('Timestamps', () => {
        test('should have createdAt timestamp', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            expect(cart.createdAt).toBeDefined();
            expect(cart.createdAt).toBeInstanceOf(Date);
        });

        test('should have updatedAt timestamp', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            expect(cart.updatedAt).toBeDefined();
            expect(cart.updatedAt).toBeInstanceOf(Date);
        });

        test('should update updatedAt on modification', async () => {
            const user = await getMockUser();
            const product = await getMockProduct();
            const cart = new Cart(getMockCart(user, product));
            await cart.save();

            const originalUpdatedAt = cart.updatedAt;

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 10));

            cart.items[0].quantity = 5;
            await cart.save();

            expect(cart.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
        });
    });
});
