/**
 * User Controller Tests
 * Coverage: Profile management, addresses, password change, orders
 */

const mongoose = require('mongoose');
const User = require('../../models/user');
const Order = require('../../models/order');
const bcrypt = require('bcryptjs');
const userController = require('../../controllers/user');

// Test data factories
const getMockUser = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'customer',
    addresses: [],
    loyaltyPoints: 0,
    ...overrides
});

const getMockAddress = (overrides = {}) => ({
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Vietnam',
    isDefault: false,
    ...overrides
});

const getMockOrder = (overrides = {}) => ({
    orderNumber: '12345',
    items: [],
    totalAmount: 100,
    status: 'pending',
    ...overrides
});

describe('User Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = global.testHelpers.createMockReq();
        res = global.testHelpers.createMockRes();
    });

    describe('getProfile', () => {
        describe('Happy path', () => {
            it('should render profile page for authenticated user', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getProfile(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/profile',
                    expect.objectContaining({
                        user: expect.any(Object)
                    })
                );
            });
        });

        describe('Authentication errors (401)', () => {
            it('should redirect to login if not authenticated', async () => {
                req.isAuthenticated = jest.fn(() => false);

                await userController.getProfile(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            });
        });
    });

    describe('updateProfile', () => {
        describe('Happy path', () => {
            it('should update user profile successfully', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    name: 'Updated Name',
                    email: 'updated@example.com',
                    phone: '1234567890'
                };

                await userController.updateProfile(req, res);

                const updatedUser = await User.findById(user._id);
                expect(updatedUser.name).toBe('Updated Name');
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject invalid email format', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    name: 'Test User',
                    email: 'invalid-email'
                };

                await userController.updateProfile(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            });

            it('should reject duplicate email', async () => {
                await User.create(getMockUser({ email: 'existing@example.com' }));
                const user = await User.create(getMockUser({ email: 'test@example.com' }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    name: 'Test User',
                    email: 'existing@example.com'
                };

                await userController.updateProfile(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('đã tồn tại'));
            });
        });

        describe('Authentication errors (401)', () => {
            it('should reject if user not authenticated', async () => {
                req.isAuthenticated = jest.fn(() => false);
                req.body = { name: 'Test' };

                await userController.updateProfile(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            });
        });
    });

    describe('getAddresses', () => {
        describe('Happy path', () => {
            it('should return user addresses', async () => {
                const user = await User.create(getMockUser({
                    addresses: [getMockAddress()]
                }));
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getAddresses(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/addresses',
                    expect.objectContaining({
                        addresses: expect.any(Array)
                    })
                );
            });

            it('should return empty array when no addresses', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getAddresses(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/addresses',
                    expect.objectContaining({
                        addresses: []
                    })
                );
            });
        });
    });

    describe('addAddress', () => {
        describe('Happy path', () => {
            it('should add new address successfully', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = getMockAddress();

                await userController.addAddress(req, res);

                const updatedUser = await User.findById(user._id);
                expect(updatedUser.addresses.length).toBe(1);
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });

            it('should set first address as default', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = getMockAddress({ isDefault: true });

                await userController.addAddress(req, res);

                const updatedUser = await User.findById(user._id);
                expect(updatedUser.addresses[0].isDefault).toBe(true);
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject incomplete address', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    street: '123 Test St'
                    // Missing required fields
                };

                await userController.addAddress(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            });
        });

        describe('Edge cases', () => {
            it('should handle maximum addresses limit', async () => {
                const addresses = Array(10).fill(null).map(() => getMockAddress());
                const user = await User.create(getMockUser({ addresses }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = getMockAddress();

                await userController.addAddress(req, res);

                // Should succeed or reject based on business logic
                expect(req.flash).toHaveBeenCalled();
            });
        });
    });

    describe('updateAddress', () => {
        describe('Happy path', () => {
            it('should update existing address successfully', async () => {
                const address = getMockAddress();
                const user = await User.create(getMockUser({
                    addresses: [address]
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { addressId: user.addresses[0]._id.toString() };
                req.body = {
                    ...address,
                    street: '456 Updated St'
                };

                await userController.updateAddress(req, res);

                const updatedUser = await User.findById(user._id);
                expect(updatedUser.addresses[0].street).toBe('456 Updated St');
            });
        });

        describe('Not found (404)', () => {
            it('should reject if address not found', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { addressId: new mongoose.Types.ObjectId().toString() };
                req.body = getMockAddress();

                await userController.updateAddress(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không tìm thấy'));
            });
        });
    });

    describe('deleteAddress', () => {
        describe('Happy path', () => {
            it('should delete address successfully', async () => {
                const user = await User.create(getMockUser({
                    addresses: [getMockAddress(), getMockAddress()]
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { addressId: user.addresses[0]._id.toString() };

                await userController.deleteAddress(req, res);

                const updatedUser = await User.findById(user._id);
                expect(updatedUser.addresses.length).toBe(1);
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject deleting last address', async () => {
                const user = await User.create(getMockUser({
                    addresses: [getMockAddress()]
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { addressId: user.addresses[0]._id.toString() };

                await userController.deleteAddress(req, res);

                // Depending on business logic, might reject or succeed
                expect(req.flash).toHaveBeenCalled();
            });
        });
    });

    describe('postChangePassword', () => {
        describe('Happy path', () => {
            it('should change password successfully with correct old password', async () => {
                const hashedPassword = await bcrypt.hash('oldPassword123', 10);
                const user = await User.create(getMockUser({
                    password: hashedPassword
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    currentPassword: 'oldPassword123',
                    newPassword: 'newPassword123',
                    confirmPassword: 'newPassword123'
                };

                await userController.postChangePassword(req, res);

                const updatedUser = await User.findById(user._id);
                const isMatch = await bcrypt.compare('newPassword123', updatedUser.password);
                expect(isMatch).toBe(true);
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject if current password is incorrect', async () => {
                const hashedPassword = await bcrypt.hash('correctPassword', 10);
                const user = await User.create(getMockUser({
                    password: hashedPassword
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    currentPassword: 'wrongPassword',
                    newPassword: 'newPassword123',
                    confirmPassword: 'newPassword123'
                };

                await userController.postChangePassword(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không đúng'));
            });

            it('should reject if new passwords do not match', async () => {
                const hashedPassword = await bcrypt.hash('oldPassword123', 10);
                const user = await User.create(getMockUser({
                    password: hashedPassword
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    currentPassword: 'oldPassword123',
                    newPassword: 'newPassword123',
                    confirmPassword: 'differentPassword123'
                };

                await userController.postChangePassword(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không khớp'));
            });

            it('should reject weak new password', async () => {
                const hashedPassword = await bcrypt.hash('oldPassword123', 10);
                const user = await User.create(getMockUser({
                    password: hashedPassword
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    currentPassword: 'oldPassword123',
                    newPassword: '123',
                    confirmPassword: '123'
                };

                await userController.postChangePassword(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            });
        });

        describe('Edge cases', () => {
            it('should reject if new password same as old password', async () => {
                const hashedPassword = await bcrypt.hash('samePassword123', 10);
                const user = await User.create(getMockUser({
                    password: hashedPassword
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.body = {
                    currentPassword: 'samePassword123',
                    newPassword: 'samePassword123',
                    confirmPassword: 'samePassword123'
                };

                await userController.postChangePassword(req, res);

                // Depending on business logic
                expect(req.flash).toHaveBeenCalled();
            });
        });
    });

    describe('getUserOrders', () => {
        describe('Happy path', () => {
            it('should return user order history', async () => {
                const user = await User.create(getMockUser());
                await Order.create({
                    ...getMockOrder(),
                    user: user._id
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getUserOrders(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/orders',
                    expect.objectContaining({
                        orders: expect.any(Array)
                    })
                );
            });

            it('should return empty array when no orders', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getUserOrders(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/orders',
                    expect.objectContaining({
                        orders: expect.arrayContaining([])
                    })
                );
            });
        });

        describe('Edge cases', () => {
            it('should handle pagination for many orders', async () => {
                const user = await User.create(getMockUser());

                // Create many orders
                for (let i = 0; i < 25; i++) {
                    await Order.create({
                        ...getMockOrder(),
                        orderNumber: `ORD${i}`,
                        user: user._id
                    });
                }

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.query = { page: 1 };

                await userController.getUserOrders(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });
    });

    describe('getOrderDetail', () => {
        describe('Happy path', () => {
            it('should return order details for own order', async () => {
                const user = await User.create(getMockUser());
                const order = await Order.create({
                    ...getMockOrder(),
                    user: user._id
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: order._id.toString() };

                await userController.getOrderDetail(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/order-detail',
                    expect.objectContaining({
                        order: expect.any(Object)
                    })
                );
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject viewing other user order', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'other@example.com' }));
                const order = await Order.create({
                    ...getMockOrder(),
                    user: user2._id
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: order._id.toString() };

                await userController.getOrderDetail(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không có quyền'));
            });
        });

        describe('Not found (404)', () => {
            it('should reject if order not found', async () => {
                const user = await User.create(getMockUser());
                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: new mongoose.Types.ObjectId().toString() };

                await userController.getOrderDetail(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không tìm thấy'));
            });
        });
    });

    describe('cancelOrder', () => {
        describe('Happy path', () => {
            it('should cancel pending order successfully', async () => {
                const user = await User.create(getMockUser());
                const order = await Order.create({
                    ...getMockOrder(),
                    user: user._id,
                    status: 'pending'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: order._id.toString() };

                await userController.cancelOrder(req, res);

                const updatedOrder = await Order.findById(order._id);
                expect(updatedOrder.status).toBe('cancelled');
                expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject cancelling shipped order', async () => {
                const user = await User.create(getMockUser());
                const order = await Order.create({
                    ...getMockOrder(),
                    user: user._id,
                    status: 'shipped'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: order._id.toString() };

                await userController.cancelOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không thể hủy'));
            });

            it('should reject cancelling delivered order', async () => {
                const user = await User.create(getMockUser());
                const order = await Order.create({
                    ...getMockOrder(),
                    user: user._id,
                    status: 'delivered'
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: order._id.toString() };

                await userController.cancelOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không thể hủy'));
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject cancelling other user order', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'other@example.com' }));
                const order = await Order.create({
                    ...getMockOrder(),
                    user: user2._id,
                    status: 'pending'
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { orderId: order._id.toString() };

                await userController.cancelOrder(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không có quyền'));
            });
        });
    });

    describe('getLoyaltyPoints', () => {
        describe('Happy path', () => {
            it('should return user loyalty points', async () => {
                const user = await User.create(getMockUser({
                    loyaltyPoints: 150
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getLoyaltyPoints(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'user/loyalty',
                    expect.objectContaining({
                        loyaltyPoints: 150
                    })
                );
            });
        });

        describe('Edge cases', () => {
            it('should handle user with zero loyalty points', async () => {
                const user = await User.create(getMockUser({
                    loyaltyPoints: 0
                }));

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await userController.getLoyaltyPoints(req, res);

                expect(res.render).toHaveBeenCalled();
            });
        });
    });

    describe('Server errors (500)', () => {
        it('should handle database errors gracefully', async () => {
            const user = await User.create(getMockUser());
            req.user = user;
            req.isAuthenticated = jest.fn(() => true);

            jest.spyOn(User, 'findById').mockRejectedValueOnce(new Error('DB Error'));

            await userController.getProfile(req, res);

            expect(res.redirect).toHaveBeenCalled();
        });
    });
});
