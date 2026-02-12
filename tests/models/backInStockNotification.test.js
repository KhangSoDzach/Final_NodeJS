/**
 * Unit Tests cho BackInStockNotification Model
 */

const mongoose = require('mongoose');
const BackInStockNotification = require('../../models/backInStockNotification');
const Product = require('../../models/product');
const User = require('../../models/user');

// Mock emailService
jest.mock('../../utils/emailService', () => ({
  sendPreOrderNotification: jest.fn().mockResolvedValue(true),
  sendBackInStockNotification: jest.fn().mockResolvedValue(true),
  sendLowStockAlert: jest.fn().mockResolvedValue(true)
}));

describe('BackInStockNotification Model Tests', () => {
  let testProduct;
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'Password123!'
    });

    // Tạo product hết hàng
    testProduct = await Product.create({
      name: 'Out of Stock Product',
      slug: 'out-of-stock-product',
      description: 'Test Description',
      price: 1000000,
      stock: 0,  // Hết hàng
      category: 'laptop',
      brand: 'test-brand'
    });
  });

  describe('Schema Validation', () => {
    it('should create a valid notification subscription', async () => {
      const notification = await BackInStockNotification.create({
        email: 'test@example.com',
        product: testProduct._id
      });

      expect(notification._id).toBeDefined();
      expect(notification.status).toBe('active');
      expect(notification.notificationCount).toBe(0);
    });

    it('should allow subscription with user reference', async () => {
      const notification = await BackInStockNotification.create({
        email: testUser.email,
        product: testProduct._id,
        user: testUser._id
      });

      expect(notification.user.toString()).toBe(testUser._id.toString());
    });

    it('should require email field', async () => {
      await expect(BackInStockNotification.create({
        product: testProduct._id
      })).rejects.toThrow('Path `email` is required');
    });

    it('should require product field', async () => {
      await expect(BackInStockNotification.create({
        email: 'test@example.com'
      })).rejects.toThrow('Path `product` is required');
    });

    it('should reject invalid status', async () => {
      await expect(BackInStockNotification.create({
        email: 'test@example.com',
        product: testProduct._id,
        status: 'invalid_status'
      })).rejects.toThrow();
    });

    it('should handle variant subscription', async () => {
      const notification = await BackInStockNotification.create({
        email: 'test@example.com',
        product: testProduct._id,
        variant: {
          name: 'Màu sắc',
          value: 'Đen'
        }
      });

      expect(notification.variant.name).toBe('Màu sắc');
      expect(notification.variant.value).toBe('Đen');
    });
  });

  describe('subscribe Static Method', () => {
    it('should create new subscription', async () => {
      const subscription = await BackInStockNotification.subscribe({
        email: 'subscriber@test.com',
        productId: testProduct._id
      });

      expect(subscription._id).toBeDefined();
      expect(subscription.status).toBe('active');
      expect(subscription.email).toBe('subscriber@test.com');
    });

    it('should throw error if already subscribed', async () => {
      // Tạo subscription đầu tiên
      await BackInStockNotification.subscribe({
        email: 'duplicate@test.com',
        productId: testProduct._id
      });

      // Cố gắng subscribe lần nữa sẽ throw error
      await expect(BackInStockNotification.subscribe({
        email: 'duplicate@test.com',
        productId: testProduct._id
      })).rejects.toThrow('đã đăng ký');
    });

    it('should reactivate unsubscribed subscription', async () => {
      // Tạo và unsubscribe
      const sub = await BackInStockNotification.create({
        email: 'unsub@test.com',
        product: testProduct._id,
        status: 'unsubscribed'
      });

      // Subscribe lại
      const reactivated = await BackInStockNotification.subscribe({
        email: 'unsub@test.com',
        productId: testProduct._id
      });

      expect(reactivated.status).toBe('active');
    });

    it('should link subscription to user if provided', async () => {
      const subscription = await BackInStockNotification.subscribe({
        email: testUser.email,
        productId: testProduct._id,
        userId: testUser._id
      });

      expect(subscription.user.toString()).toBe(testUser._id.toString());
    });

    it('should throw error if product not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(BackInStockNotification.subscribe({
        email: 'test@test.com',
        productId: fakeId
      })).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('should throw error if product is in stock', async () => {
      // Tạo product còn hàng
      const inStockProduct = await Product.create({
        name: 'In Stock',
        slug: 'in-stock',
        description: 'Test',
        price: 1000000,
        stock: 10,
        category: 'laptop',
        brand: 'test'
      });

      await expect(BackInStockNotification.subscribe({
        email: 'test@test.com',
        productId: inStockProduct._id
      })).rejects.toThrow('còn hàng');
    });
  });

  describe('unsubscribe Static Method', () => {
    it('should unsubscribe successfully', async () => {
      // Tạo subscription
      await BackInStockNotification.create({
        email: 'unsubscribe@test.com',
        product: testProduct._id,
        status: 'active'
      });

      const result = await BackInStockNotification.unsubscribe(
        'unsubscribe@test.com',
        testProduct._id
      );

      expect(result.status).toBe('unsubscribed');
    });

    it('should throw error if subscription not found', async () => {
      await expect(BackInStockNotification.unsubscribe(
        'nonexistent@test.com',
        testProduct._id
      )).rejects.toThrow('Không tìm thấy đăng ký');
    });
  });

  describe('notifySubscribers Static Method', () => {
    it('should notify all active subscribers and return summary', async () => {
      // Tạo nhiều subscriptions
      await BackInStockNotification.create({
        email: 'sub1@test.com',
        product: testProduct._id,
        status: 'active'
      });
      await BackInStockNotification.create({
        email: 'sub2@test.com',
        product: testProduct._id,
        status: 'active'
      });

      const result = await BackInStockNotification.notifySubscribers(testProduct._id);
      
      // Should return { sent, failed } object
      expect(result).toHaveProperty('sent');
      expect(result).toHaveProperty('failed');
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should not include unsubscribed users', async () => {
      await BackInStockNotification.create({
        email: 'active@test.com',
        product: testProduct._id,
        status: 'active'
      });
      await BackInStockNotification.create({
        email: 'inactive@test.com',
        product: testProduct._id,
        status: 'unsubscribed'
      });

      const result = await BackInStockNotification.notifySubscribers(testProduct._id);
      
      expect(result.sent).toBe(1); // Only active one
    });

    it('should set notifiedAt timestamp after notification', async () => {
      const sub = await BackInStockNotification.create({
        email: 'timestamp@test.com',
        product: testProduct._id,
        status: 'active'
      });

      await BackInStockNotification.notifySubscribers(testProduct._id);

      const updated = await BackInStockNotification.findById(sub._id);
      expect(updated.notifiedAt).toBeDefined();
      expect(updated.status).toBe('notified');
      expect(updated.notificationCount).toBe(1);
    });

    it('should return empty result if no active subscribers', async () => {
      const result = await BackInStockNotification.notifySubscribers(testProduct._id);
      
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('getSubscriberCount Static Method', () => {
    it('should return count of active subscribers', async () => {
      await BackInStockNotification.create({
        email: 'count1@test.com',
        product: testProduct._id,
        status: 'active'
      });
      await BackInStockNotification.create({
        email: 'count2@test.com',
        product: testProduct._id,
        status: 'active'
      });
      await BackInStockNotification.create({
        email: 'count3@test.com',
        product: testProduct._id,
        status: 'unsubscribed'
      });

      const count = await BackInStockNotification.getSubscriberCount(testProduct._id);
      
      expect(count).toBe(2); // Only active ones
    });

    it('should return 0 if no subscribers', async () => {
      const count = await BackInStockNotification.getSubscriberCount(testProduct._id);
      expect(count).toBe(0);
    });
  });

  describe('Compound Index Uniqueness', () => {
    it('should throw error for duplicate active subscriptions', async () => {
      await BackInStockNotification.create({
        email: 'unique@test.com',
        product: testProduct._id,
        status: 'active'
      });

      // Subscribe sẽ throw error vì đã có active subscription
      await expect(BackInStockNotification.subscribe({
        email: 'unique@test.com',
        productId: testProduct._id
      })).rejects.toThrow('đã đăng ký');
    });
  });

  describe('Variant-specific Subscriptions', () => {
    it('should allow separate subscriptions for different variants', async () => {
      await BackInStockNotification.create({
        email: 'variant@test.com',
        product: testProduct._id,
        variant: { name: 'Color', value: 'Red' },
        status: 'active'
      });

      await BackInStockNotification.create({
        email: 'variant@test.com',
        product: testProduct._id,
        variant: { name: 'Color', value: 'Blue' },
        status: 'active'
      });

      const count = await BackInStockNotification.countDocuments({
        email: 'variant@test.com',
        product: testProduct._id
      });

      expect(count).toBe(2);
    });
  });
});
