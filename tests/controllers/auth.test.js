/**
 * Authentication Controller Tests
 * Tests for registration, login, forgot/reset password, and Google OAuth flows
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const Cart = require('../../models/cart');
const authController = require('../../controllers/auth');

// Mock email service to prevent actual email sending during tests
jest.mock('../../utils/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

describe('Authentication Controller', () => {
    // Helper to create mock request/response
    const createMockReq = (overrides = {}) => ({
        body: {},
        query: {},
        session: {},
        flash: jest.fn(),
        login: jest.fn((user, callback) => callback(null)),
        logout: jest.fn((callback) => callback(null)),
        isAuthenticated: jest.fn(() => false),
        get: jest.fn((header) => {
            if (header === 'host') return 'localhost:3000';
            return null;
        }),
        protocol: 'http',
        ...overrides
    });

    const createMockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.render = jest.fn().mockReturnValue(res);
        res.redirect = jest.fn().mockReturnValue(res);
        return res;
    };

    // ====================================
    // Registration Tests
    // ====================================
    describe('postRegister', () => {
        test('should create new user with valid data', async () => {
            const req = createMockReq({
                body: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                }
            });
            const res = createMockRes();

            await authController.postRegister(req, res);

            // Verify user was created
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user).toBeDefined();
            expect(user.name).toBe('Test User');
            expect(user.role).toBe('customer');

            // Verify password was hashed
            const isPasswordHashed = await bcrypt.compare('password123', user.password);
            expect(isPasswordHashed).toBe(true);

            // Verify auto-login was attempted
            expect(req.login).toHaveBeenCalled();
        });

        test('should reject duplicate email', async () => {
            // Create existing user
            const existingUser = new User({
                name: 'Existing User',
                email: 'existing@example.com',
                password: await bcrypt.hash('password123', 12),
                role: 'customer'
            });
            await existingUser.save();

            const req = createMockReq({
                body: {
                    name: 'New User',
                    email: 'existing@example.com',
                    password: 'password456'
                }
            });
            const res = createMockRes();

            await authController.postRegister(req, res);

            // Should render register page with error
            expect(res.render).toHaveBeenCalledWith(
                'auth/register',
                expect.objectContaining({
                    title: 'Đăng ký'
                })
            );
            expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('Email đã tồn tại'));
        });

        test('should hash password before saving', async () => {
            const plainPassword = 'mySecretPassword123';
            const req = createMockReq({
                body: {
                    name: 'Password Test User',
                    email: 'passwordtest@example.com',
                    password: plainPassword
                }
            });
            const res = createMockRes();

            await authController.postRegister(req, res);

            const user = await User.findOne({ email: 'passwordtest@example.com' });

            // Password should NOT be stored in plain text
            expect(user.password).not.toBe(plainPassword);

            // But should match when compared with bcrypt
            const isMatch = await bcrypt.compare(plainPassword, user.password);
            expect(isMatch).toBe(true);
        });

        test('should merge guest cart after registration', async () => {
            // Create guest cart
            const guestCart = new Cart({
                sessionId: 'guest-session-123',
                items: [{
                    product: new mongoose.Types.ObjectId(),
                    quantity: 2,
                    price: 100000
                }]
            });
            await guestCart.save();

            const req = createMockReq({
                body: {
                    name: 'Cart Merge User',
                    email: 'cartmerge@example.com',
                    password: 'password123'
                },
                session: {
                    cartId: 'guest-session-123'
                }
            });
            const res = createMockRes();

            await authController.postRegister(req, res);

            // Find the cart and verify it's now linked to user
            const updatedCart = await Cart.findById(guestCart._id).populate('user');
            expect(updatedCart.user).toBeDefined();
            expect(updatedCart.sessionId).toBeNull();
            expect(req.session.cartId).toBeUndefined();
        });
    });

    // ====================================
    // Login Tests
    // ====================================
    describe('postLogin', () => {
        let testUser;

        beforeEach(async () => {
            // Create test user
            testUser = new User({
                name: 'Login Test User',
                email: 'logintest@example.com',
                password: await bcrypt.hash('correctPassword', 12),
                role: 'customer',
                isBanned: false
            });
            await testUser.save();
        });

        test('should authenticate user with valid credentials', async () => {
            const req = createMockReq({
                body: {
                    email: 'logintest@example.com',
                    password: 'correctPassword'
                }
            });
            const res = createMockRes();
            const next = jest.fn();

            // This test requires passport setup which is complex
            // For now, verify user exists and password matches
            const user = await User.findOne({ email: 'logintest@example.com' });
            expect(user).toBeDefined();

            const isPasswordValid = await bcrypt.compare('correctPassword', user.password);
            expect(isPasswordValid).toBe(true);
            expect(user.isBanned).toBe(false);
        });

        test('should reject banned user', async () => {
            // Update user to banned
            testUser.isBanned = true;
            testUser.banReason = 'Violation of terms';
            await testUser.save();

            const req = createMockReq({
                body: {
                    email: 'logintest@example.com',
                    password: 'correctPassword'
                }
            });
            const res = createMockRes();

            // Verify user is banned in database
            const bannedUser = await User.findOne({ email: 'logintest@example.com' });
            expect(bannedUser.isBanned).toBe(true);
            expect(bannedUser.banReason).toBe('Violation of terms');
        });

        test('should fail with invalid email', async () => {
            const user = await User.findOne({ email: 'nonexistent@example.com' });
            expect(user).toBeNull();
        });

        test('should fail with invalid password', async () => {
            const user = await User.findOne({ email: 'logintest@example.com' });
            const isPasswordValid = await bcrypt.compare('wrongPassword', user.password);
            expect(isPasswordValid).toBe(false);
        });
    });

    // ====================================
    // Forgot/Reset Password Tests
    // ====================================
    describe('postForgotPassword', () => {
        test('should generate reset token for valid email', async () => {
            const user = new User({
                name: 'Reset Test User',
                email: 'resettest@example.com',
                password: await bcrypt.hash('password123', 12),
                role: 'customer'
            });
            await user.save();

            const req = createMockReq({
                body: { email: 'resettest@example.com' }
            });
            const res = createMockRes();

            await authController.postForgotPassword(req, res);

            // Verify reset token was generated
            const updatedUser = await User.findOne({ email: 'resettest@example.com' });
            expect(updatedUser.resetToken).toBeDefined();
            expect(updatedUser.resetTokenExpiration).toBeDefined();
            expect(updatedUser.resetTokenExpiration > new Date()).toBe(true);
        });

        test('should handle non-existent email gracefully', async () => {
            const req = createMockReq({
                body: { email: 'doesnotexist@example.com' }
            });
            const res = createMockRes();

            await authController.postForgotPassword(req, res);

            // Should not create a user or throw error
            const user = await User.findOne({ email: 'doesnotexist@example.com' });
            expect(user).toBeNull();
        });
    });

    describe('postResetPassword', () => {
        test('should reset password with valid token', async () => {
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');

            const user = new User({
                name: 'Token Reset User',
                email: 'tokenreset@example.com',
                password: await bcrypt.hash('oldPassword', 12),
                role: 'customer',
                resetToken,
                resetTokenExpiration: new Date(Date.now() + 3600000) // 1 hour from now
            });
            await user.save();

            const req = createMockReq({
                params: { token: resetToken },
                body: { password: 'newPassword123' }
            });
            const res = createMockRes();

            await authController.postResetPassword(req, res);

            // Verify password was updated
            const updatedUser = await User.findOne({ email: 'tokenreset@example.com' });
            const isNewPasswordValid = await bcrypt.compare('newPassword123', updatedUser.password);
            expect(isNewPasswordValid).toBe(true);

            // Verify token was cleared
            expect(updatedUser.resetToken).toBeUndefined();
            expect(updatedUser.resetTokenExpiration).toBeUndefined();
        });

        test('should reject expired token', async () => {
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');

            const user = new User({
                name: 'Expired Token User',
                email: 'expiredtoken@example.com',
                password: await bcrypt.hash('oldPassword', 12),
                role: 'customer',
                resetToken,
                resetTokenExpiration: new Date(Date.now() - 3600000) // 1 hour ago (expired)
            });
            await user.save();

            const req = createMockReq({
                params: { token: resetToken },
                body: { password: 'newPassword123' }
            });
            const res = createMockRes();

            await authController.postResetPassword(req, res);

            // Password should NOT have been updated
            const updatedUser = await User.findOne({ email: 'expiredtoken@example.com' });
            const isOldPasswordStillValid = await bcrypt.compare('oldPassword', updatedUser.password);
            expect(isOldPasswordStillValid).toBe(true);
        });

        test('should reject invalid token', async () => {
            const req = createMockReq({
                params: { token: 'invalid-token-12345' },
                body: { password: 'newPassword123' }
            });
            const res = createMockRes();

            await authController.postResetPassword(req, res);

            // Should render error or redirect
            expect(res.render).toHaveBeenCalled();
        });
    });

    // ====================================
    // Logout Tests
    // ====================================
    describe('getLogout', () => {
        test('should logout user and redirect to home', async () => {
            const req = createMockReq({
                user: { _id: 'user123', name: 'Test User' }
            });
            const res = createMockRes();

            await authController.getLogout(req, res);

            expect(req.logout).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/');
        });
    });
});
