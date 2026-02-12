/**
 * Unit Tests cho PreOrder Model
 */

const mongoose = require('mongoose');
const PreOrder = require('../../models/preOrder');
const Product = require('../../models/product');
const User = require('../../models/user');

// Mock emailService
jest.mock('../../utils/emailService', () => ({
  sendPreOrderNotification: jest.fn().mockResolvedValue(true),
  sendBackInStockNotification: jest.fn().mockResolvedValue(true),
  sendLowStockAlert: jest.fn().mockResolvedValue(true)
}));

describe('PreOrder Model Tests', () => {
  let testProduct;
  let testUser;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'Password123!'
    });

    // Tạo product hết hàng với allowPreOrder = true
    testProduct = await Product.create({
      name: 'Out of Stock Product',
      slug: 'out-of-stock-product',
      description: 'Test Description',
      price: 1000000,
      discountPrice: 900000,
      stock: 0,  // Hết hàng
      category: 'laptop',
      brand: 'test-brand',
      allowPreOrder: true
    });
  });

  describe('Schema Validation', () => {
    it('should create a valid pre-order', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        contactPhone: '0123456789'
      });

      expect(preOrder._id).toBeDefined();
      expect(preOrder.status).toBe('pending');
      expect(preOrder.quantity).toBe(1);
    });

    it('should reject invalid status', async () => {
      await expect(PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        status: 'invalid_status'
      })).rejects.toThrow();
    });

    it('should require product field', async () => {
      await expect(PreOrder.create({
        user: testUser._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email
      })).rejects.toThrow();
    });

    it('should require contactEmail field', async () => {
      await expect(PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000
      })).rejects.toThrow('Path `contactEmail` is required');
    });
  });

  describe('createPreOrder Static Method', () => {
    it('should create pre-order successfully', async () => {
      const preOrder = await PreOrder.createPreOrder({
        userId: testUser._id,
        productId: testProduct._id,
        quantity: 1,
        contactEmail: testUser.email,
        contactPhone: '0123456789'
      });

      expect(preOrder._id).toBeDefined();
      expect(preOrder.status).toBe('pending');
      expect(preOrder.priceAtOrder).toBe(testProduct.discountPrice);
    });

    it('should use regular price if no discount price', async () => {
      // Tạo product không có discountPrice
      const productNoDiscount = await Product.create({
        name: 'No Discount Product',
        slug: 'no-discount-product',
        description: 'Test',
        price: 1500000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        allowPreOrder: true
      });

      const preOrder = await PreOrder.createPreOrder({
        userId: testUser._id,
        productId: productNoDiscount._id,
        quantity: 1,
        contactEmail: testUser.email
      });

      expect(preOrder.priceAtOrder).toBe(1500000);
    });

    it('should throw error if product not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(PreOrder.createPreOrder({
        userId: testUser._id,
        productId: fakeId,
        quantity: 1,
        contactEmail: testUser.email
      })).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('should throw error if product is in stock', async () => {
      // Tạo product còn hàng
      const inStockProduct = await Product.create({
        name: 'In Stock Product',
        slug: 'in-stock-product',
        description: 'Test',
        price: 1000000,
        stock: 10,  // Còn hàng
        category: 'laptop',
        brand: 'test',
        allowPreOrder: true
      });

      await expect(PreOrder.createPreOrder({
        userId: testUser._id,
        productId: inStockProduct._id,
        quantity: 1,
        contactEmail: testUser.email
      })).rejects.toThrow('còn hàng');
    });

    it('should throw error if already have active pre-order', async () => {
      // Tạo pre-order đầu tiên
      await PreOrder.createPreOrder({
        userId: testUser._id,
        productId: testProduct._id,
        quantity: 1,
        contactEmail: testUser.email
      });

      // Cố gắng tạo thêm pre-order
      await expect(PreOrder.createPreOrder({
        userId: testUser._id,
        productId: testProduct._id,
        quantity: 1,
        contactEmail: testUser.email
      })).rejects.toThrow('đã đặt trước');
    });
  });

  describe('notifyWhenInStock Static Method', () => {
    it('should update status to notified and set expiry', async () => {
      // Tạo pre-order pending
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        status: 'pending'
      });

      await PreOrder.notifyWhenInStock(testProduct._id);

      const updatedPreOrder = await PreOrder.findById(preOrder._id);
      expect(updatedPreOrder.status).toBe('notified');
      expect(updatedPreOrder.notifiedAt).toBeDefined();
    });

    it('should only notify pending pre-orders', async () => {
      // Pre-order đã notified
      const notifiedPreOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: 'notified@test.com',
        status: 'notified',
        notifiedAt: new Date()
      });

      // Pre-order pending
      const pendingPreOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: 'pending@test.com',
        status: 'pending'
      });

      await PreOrder.notifyWhenInStock(testProduct._id);

      const updatedNotified = await PreOrder.findById(notifiedPreOrder._id);
      const updatedPending = await PreOrder.findById(pendingPreOrder._id);

      // Notified vẫn giữ nguyên
      expect(updatedNotified.status).toBe('notified');
      // Pending được cập nhật
      expect(updatedPending.status).toBe('notified');
    });
  });

  describe('expireOldPreOrders Static Method', () => {
    it('should expire old notified pre-orders with past expiresAt', async () => {
      // Tạo pre-order notified với expiresAt đã qua
      const expiredPreOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: 'expired@test.com',
        status: 'notified',
        notifiedAt: new Date(Date.now() - 49 * 60 * 60 * 1000), // 49 hours ago
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago (expired)
      });

      const expiredCount = await PreOrder.expireOldPreOrders();
      
      expect(expiredCount).toBeGreaterThanOrEqual(1);
      
      const updatedPreOrder = await PreOrder.findById(expiredPreOrder._id);
      expect(updatedPreOrder.status).toBe('expired');
    });

    it('should not expire valid notified pre-orders', async () => {
      // Tạo pre-order notified với expiresAt trong tương lai
      const validPreOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: 'valid@test.com',
        status: 'notified',
        notifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });

      await PreOrder.expireOldPreOrders();
      
      const updatedPreOrder = await PreOrder.findById(validPreOrder._id);
      expect(updatedPreOrder.status).toBe('notified');
    });
  });

  describe('isExpired Virtual', () => {
    it('should return false if no expiresAt', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email
      });

      expect(preOrder.isExpired).toBe(false);
    });

    it('should return true if expiresAt is in past', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        expiresAt: new Date(Date.now() - 1000)
      });

      expect(preOrder.isExpired).toBe(true);
    });

    it('should return false if expiresAt is in future', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        expiresAt: new Date(Date.now() + 1000000)
      });

      expect(preOrder.isExpired).toBe(false);
    });
  });

  describe('Status Transitions', () => {
    it('should allow transition from pending to notified', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        status: 'pending'
      });

      preOrder.status = 'notified';
      preOrder.notifiedAt = new Date();
      await preOrder.save();

      expect(preOrder.status).toBe('notified');
    });

    it('should allow transition from notified to converted', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        status: 'notified',
        notifiedAt: new Date()
      });

      preOrder.status = 'converted';
      preOrder.convertedAt = new Date();
      preOrder.order = new mongoose.Types.ObjectId();
      await preOrder.save();

      expect(preOrder.status).toBe('converted');
      expect(preOrder.order).toBeDefined();
    });

    it('should allow cancellation from any status', async () => {
      const preOrder = await PreOrder.create({
        user: testUser._id,
        product: testProduct._id,
        quantity: 1,
        priceAtOrder: 900000,
        contactEmail: testUser.email,
        status: 'pending'
      });

      preOrder.status = 'cancelled';
      await preOrder.save();

      expect(preOrder.status).toBe('cancelled');
    });
  });
});
