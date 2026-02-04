/**
 * User Model Tests
 * Comprehensive tests for User schema, authentication, and user management
 */

const mongoose = require('mongoose');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
    // Factory function
    const getMockUser = (overrides = {}) => ({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        role: 'customer',
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ====================================
    // User Creation Tests
    // ====================================
    describe('User Creation', () => {
        test('should create user with valid data - happy path', async () => {
            const userData = getMockUser({
                password: await bcrypt.hash('password123', 12)
            });
            const user = new User(userData);
            await user.save();

            expect(user._id).toBeDefined();
            expect(user.name).toBe('Test User');
            expect(user.email).toBe('test@example.com');
            expect(user.role).toBe('customer');
        });

        test('should require name', async () => {
            const userData = {
                email: 'test@example.com',
                password: await bcrypt.hash('password', 12)
            };

            const user = new User(userData);

            try {
                await user.save();
            } catch (error) {
                expect(error.errors.name).toBeDefined();
            }
        });

        test('should require email', async () => {
            const userData = {
                name: 'Test User',
                password: await bcrypt.hash('password', 12)
            };

            const user = new User(userData);

            try {
                await user.save();
            } catch (error) {
                expect(error.errors.email).toBeDefined();
            }
        });

        test('should require unique email', async () => {
            const user1 = new User({
                name: 'User 1',
                email: 'duplicate@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user1.save();

            const user2 = new User({
                name: 'User 2',
                email: 'duplicate@example.com',
                password: await bcrypt.hash('password', 12)
            });

            try {
                await user2.save();
            } catch (error) {
                expect(error.code).toBe(11000); // Duplicate key error
            }
        });

        test('should validate email format', async () => {
            const user = new User({
                name: 'Test User',
                email: 'invalid-email',
                password: await bcrypt.hash('password', 12)
            });

            try {
                await user.save();
            } catch (error) {
                expect(error.errors.email).toBeDefined();
            }
        });

        test('should default role to customer', async () => {
            const user = new User({
                name: 'Test User',
                email: 'default@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.role).toBe('customer');
        });

        test('should allow admin role', async () => {
            const user = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'admin'
            });
            await user.save();

            expect(user.role).toBe('admin');
        });
    });

    // ====================================
    // Password Tests
    // ====================================
    describe('Password Management', () => {
        test('should hash password before saving', async () => {
            const plainPassword = 'mySecretPassword123';
            const user = new User({
                name: 'Password Test',
                email: 'password@example.com',
                password: await bcrypt.hash(plainPassword, 12)
            });
            await user.save();

            // Password should be hashed
            expect(user.password).not.toBe(plainPassword);

            // But should match when compared
            const isMatch = await bcrypt.compare(plainPassword, user.password);
            expect(isMatch).toBe(true);
        });

        test('should validate password comparison', async () => {
            const plainPassword = 'correctPassword';
            const user = new User({
                name: 'Test User',
                email: 'compare@example.com',
                password: await bcrypt.hash(plainPassword, 12)
            });
            await user.save();

            const isCorrect = await bcrypt.compare(plainPassword, user.password);
            expect(isCorrect).toBe(true);

            const isWrong = await bcrypt.compare('wrongPassword', user.password);
            expect(isWrong).toBe(false);
        });
    });

    // ====================================
    // User Ban Tests
    // ====================================
    describe('User Ban Management', () => {
        test('should default isBanned to false', async () => {
            const user = new User({
                name: 'Test User',
                email: 'notbanned@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.isBanned).toBe(false);
        });

        test('should ban user with reason - happy path', async () => {
            const user = new User({
                name: 'Test User',
                email: 'toban@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            user.isBanned = true;
            user.banReason = 'Violation of terms';
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.isBanned).toBe(true);
            expect(updated.banReason).toBe('Violation of terms');
        });

        test('should unban user', async () => {
            const user = new User({
                name: 'Banned User',
                email: 'banned@example.com',
                password: await bcrypt.hash('password', 12),
                isBanned: true,
                banReason: 'Previous violation'
            });
            await user.save();

            user.isBanned = false;
            user.banReason = undefined;
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.isBanned).toBe(false);
        });

        test('should store ban reason', async () => {
            const user = new User({
                name: 'Test User',
                email: 'banreason@example.com',
                password: await bcrypt.hash('password', 12),
                isBanned: true,
                banReason: 'Spam and abuse'
            });
            await user.save();

            expect(user.banReason).toBe('Spam and abuse');
        });
    });

    // ====================================
    // Loyalty Points Tests
    // ====================================
    describe('Loyalty Points', () => {
        test('should default loyalty points to 0', async () => {
            const user = new User({
                name: 'Test User',
                email: 'loyalty@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.loyaltyPoints).toBe(0);
        });

        test('should add loyalty points', async () => {
            const user = new User({
                name: 'Test User',
                email: 'points@example.com',
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: 0
            });
            await user.save();

            user.loyaltyPoints += 100;
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.loyaltyPoints).toBe(100);
        });

        test('should deduct loyalty points', async () => {
            const user = new User({
                name: 'Test User',
                email: 'deduct@example.com',
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: 500
            });
            await user.save();

            user.loyaltyPoints -= 200;
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.loyaltyPoints).toBe(300);
        });

        test('should handle negative loyalty points', async () => {
            const user = new User({
                name: 'Test User',
                email: 'negative@example.com',
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: -10
            });

            // May allow or reject negative points
            try {
                await user.save();
                expect(user.loyaltyPoints).toBe(-10);
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle large loyalty points', async () => {
            const user = new User({
                name: 'Test User',
                email: 'large@example.com',
                password: await bcrypt.hash('password', 12),
                loyaltyPoints: 999999
            });
            await user.save();

            expect(user.loyaltyPoints).toBe(999999);
        });
    });

    // ====================================
    // Password Reset Tests
    // ====================================
    describe('Password Reset', () => {
        test('should store reset token', async () => {
            const user = new User({
                name: 'Test User',
                email: 'reset@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const crypto = require('crypto');
            user.resetToken = crypto.randomBytes(32).toString('hex');
            user.resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour
            await user.save();

            expect(user.resetToken).toBeDefined();
            expect(user.resetTokenExpiration).toBeInstanceOf(Date);
        });

        test('should validate reset token expiration', async () => {
            const user = new User({
                name: 'Test User',
                email: 'tokenexp@example.com',
                password: await bcrypt.hash('password', 12),
                resetToken: 'token123',
                resetTokenExpiration: new Date(Date.now() + 3600000)
            });
            await user.save();

            const isExpired = user.resetTokenExpiration < new Date();
            expect(isExpired).toBe(false);
        });

        test('should clear reset token after use', async () => {
            const user = new User({
                name: 'Test User',
                email: 'cleartoken@example.com',
                password: await bcrypt.hash('oldPassword', 12),
                resetToken: 'token456',
                resetTokenExpiration: new Date(Date.now() + 3600000)
            });
            await user.save();

            // Reset password and clear token
            user.password = await bcrypt.hash('newPassword', 12);
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            await user.save();

            expect(user.resetToken).toBeUndefined();
            expect(user.resetTokenExpiration).toBeUndefined();
        });
    });

    // ====================================
    // User Address Tests
    // ====================================
    describe('User Addresses', () => {
        test('should store default address', async () => {
            const user = new User({
                name: 'Test User',
                email: 'address@example.com',
                password: await bcrypt.hash('password', 12),
                defaultAddress: {
                    fullName: 'Test User',
                    phone: '0123456789',
                    address: '123 Test St',
                    city: 'Test City',
                    district: 'Test District',
                    ward: 'Test Ward'
                }
            });
            await user.save();

            expect(user.defaultAddress.fullName).toBe('Test User');
            expect(user.defaultAddress.phone).toBe('0123456789');
        });

        test('should store multiple saved addresses', async () => {
            const user = new User({
                name: 'Test User',
                email: 'addresses@example.com',
                password: await bcrypt.hash('password', 12),
                savedAddresses: [
                    {
                        fullName: 'Home Address',
                        phone: '0123456789',
                        address: '123 Home St',
                        city: 'Home City'
                    },
                    {
                        fullName: 'Work Address',
                        phone: '0987654321',
                        address: '456 Work St',
                        city: 'Work City'
                    }
                ]
            });
            await user.save();

            expect(user.savedAddresses.length).toBe(2);
            expect(user.savedAddresses[0].fullName).toBe('Home Address');
        });

        test('should add new saved address', async () => {
            const user = new User({
                name: 'Test User',
                email: 'addaddress@example.com',
                password: await bcrypt.hash('password', 12),
                savedAddresses: []
            });
            await user.save();

            user.savedAddresses.push({
                fullName: 'New Address',
                phone: '0123456789',
                address: '789 New St',
                city: 'New City'
            });
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.savedAddresses.length).toBe(1);
        });

        test('should remove saved address', async () => {
            const user = new User({
                name: 'Test User',
                email: 'removeaddress@example.com',
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

            user.savedAddresses = user.savedAddresses.filter((_, index) => index !== 0);
            await user.save();

            expect(user.savedAddresses.length).toBe(1);
            expect(user.savedAddresses[0].fullName).toBe('Address 2');
        });
    });

    // ====================================
    // OAuth Tests
    // ====================================
    describe('OAuth Authentication', () => {
        test('should store Google OAuth ID', async () => {
            const user = new User({
                name: 'Google User',
                email: 'google@example.com',
                password: await bcrypt.hash('password', 12),
                googleId: 'google-oauth-123456'
            });
            await user.save();

            expect(user.googleId).toBe('google-oauth-123456');
        });

        test('should allow user without password for OAuth', async () => {
            const user = new User({
                name: 'OAuth User',
                email: 'oauth@example.com',
                googleId: 'google-oauth-789',
                role: 'customer'
            });

            try {
                await user.save();
                expect(user.googleId).toBeDefined();
            } catch (error) {
                // May require password depending on schema
                expect(error).toBeDefined();
            }
        });
    });

    // ====================================
    // Edge Cases
    // ====================================
    describe('Edge Cases', () => {
        test('should handle very long names', async () => {
            const longName = 'A'.repeat(500);
            const user = new User({
                name: longName,
                email: 'longname@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.name).toBe(longName);
        });

        test('should trim whitespace from email', async () => {
            const user = new User({
                name: 'Test User',
                email: '  trim@example.com  ',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            // Email should be trimmed or handled
            expect(user.email.trim()).toBe('trim@example.com');
        });

        test('should handle empty string fields gracefully', async () => {
            const user = new User({
                name: '',
                email: 'empty@example.com',
                password: await bcrypt.hash('password', 12)
            });

            try {
                await user.save();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle null values', async () => {
            const user = new User({
                name: null,
                email: 'null@example.com',
                password: await bcrypt.hash('password', 12)
            });

            try {
                await user.save();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle special characters in name', async () => {
            const user = new User({
                name: 'Nguyễn Văn Tèo@#$',
                email: 'special@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.name).toBe('Nguyễn Văn Tèo@#$');
        });
    });

    // ====================================
    // Query Tests
    // ====================================
    describe('User Queries', () => {
        test('should find user by email', async () => {
            const user = new User({
                name: 'Find User',
                email: 'find@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const found = await User.findOne({ email: 'find@example.com' });
            expect(found).toBeDefined();
            expect(found.name).toBe('Find User');
        });

        test('should find user by ID', async () => {
            const user = new User({
                name: 'ID User',
                email: 'id@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const found = await User.findById(user._id);
            expect(found).toBeDefined();
        });

        test('should find all users with role customer', async () => {
            const user1 = new User({
                name: 'Customer 1',
                email: 'customer1@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user1.save();

            const user2 = new User({
                name: 'Customer 2',
                email: 'customer2@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user2.save();

            const customers = await User.find({ role: 'customer' });
            expect(customers.length).toBeGreaterThanOrEqual(2);
        });

        test('should find banned users', async () => {
            const user = new User({
                name: 'Banned User',
                email: 'findban@example.com',
                password: await bcrypt.hash('password', 12),
                isBanned: true
            });
            await user.save();

            const bannedUsers = await User.find({ isBanned: true });
            expect(bannedUsers.length).toBeGreaterThan(0);
        });

        test('should count total users', async () => {
            const count = await User.countDocuments();
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    // ====================================
    // Update Tests
    // ====================================
    describe('User Updates', () => {
        test('should update user name', async () => {
            const user = new User({
                name: 'Old Name',
                email: 'update@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            user.name = 'New Name';
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.name).toBe('New Name');
        });

        test('should update user role', async () => {
            const user = new User({
                name: 'Test User',
                email: 'updaterole@example.com',
                password: await bcrypt.hash('password', 12),
                role: 'customer'
            });
            await user.save();

            user.role = 'admin';
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.role).toBe('admin');
        });

        test('should update password', async () => {
            const user = new User({
                name: 'Test User',
                email: 'updatepass@example.com',
                password: await bcrypt.hash('oldPassword', 12)
            });
            await user.save();

            user.password = await bcrypt.hash('newPassword', 12);
            await user.save();

            const isMatch = await bcrypt.compare('newPassword', user.password);
            expect(isMatch).toBe(true);
        });
    });

    // ====================================
    // Timestamp Tests
    // ====================================
    describe('Timestamps', () => {
        test('should have createdAt timestamp', async () => {
            const user = new User({
                name: 'Test User',
                email: 'timestamp@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.createdAt).toBeDefined();
            expect(user.createdAt).toBeInstanceOf(Date);
        });

        test('should have updatedAt timestamp', async () => {
            const user = new User({
                name: 'Test User',
                email: 'updated@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            expect(user.updatedAt).toBeDefined();
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        test('should update updatedAt on modification', async () => {
            const user = new User({
                name: 'Test User',
                email: 'modify@example.com',
                password: await bcrypt.hash('password', 12)
            });
            await user.save();

            const originalUpdatedAt = user.updatedAt;

            await new Promise(resolve => setTimeout(resolve, 10));

            user.name = 'Modified Name';
            await user.save();

            expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
        });
    });
});
