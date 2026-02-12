/**
 * Unit Tests cho StockMovement Model
 */

const mongoose = require('mongoose');
const StockMovement = require('../../models/stockMovement');
const Product = require('../../models/product');
const User = require('../../models/user');

describe('StockMovement Model Tests', () => {
  let testProduct;
  let testUser;

  beforeEach(async () => {
    // Tạo user để làm createdBy
    testUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'Password123!',
      role: 'admin'
    });

    // Tạo product để test
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 1000000,
      stock: 50,
      category: 'laptop',
      brand: 'test-brand',
      lowStockThreshold: 10
    });
  });

  describe('Schema Validation', () => {
    it('should create a valid stock movement', async () => {
      const movement = await StockMovement.create({
        product: testProduct._id,
        type: 'import',
        quantity: 10,
        previousStock: 50,
        newStock: 60,
        reason: 'Nhập kho bổ sung',
        createdBy: testUser._id
      });

      expect(movement._id).toBeDefined();
      expect(movement.type).toBe('import');
      expect(movement.quantity).toBe(10);
      expect(movement.previousStock).toBe(50);
      expect(movement.newStock).toBe(60);
    });

    it('should reject invalid movement type', async () => {
      await expect(StockMovement.create({
        product: testProduct._id,
        type: 'invalid_type',
        quantity: 10,
        previousStock: 50,
        newStock: 60,
        reason: 'Test',
        createdBy: testUser._id
      })).rejects.toThrow();
    });

    it('should require product field', async () => {
      await expect(StockMovement.create({
        type: 'import',
        quantity: 10,
        previousStock: 50,
        newStock: 60,
        reason: 'Test',
        createdBy: testUser._id
      })).rejects.toThrow();
    });

    it('should require createdBy field', async () => {
      await expect(StockMovement.create({
        product: testProduct._id,
        type: 'import',
        quantity: 10,
        previousStock: 50,
        newStock: 60,
        reason: 'Test'
      })).rejects.toThrow('Path `createdBy` is required');
    });
  });

  describe('createMovement Static Method', () => {
    it('should create movement and update product stock for import', async () => {
      const initialStock = testProduct.stock;
      
      const movement = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'import',
        quantity: 20,
        reason: 'Nhập kho từ NCC',
        createdBy: testUser._id
      });

      expect(movement.previousStock).toBe(initialStock);
      expect(movement.newStock).toBe(initialStock + 20);
      expect(movement.quantity).toBe(20);

      // Kiểm tra product stock đã được cập nhật
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stock).toBe(initialStock + 20);
    });

    it('should create movement and update product stock for export', async () => {
      const initialStock = testProduct.stock;
      
      const movement = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'export',
        quantity: 10,
        reason: 'Xuất kho',
        createdBy: testUser._id
      });

      expect(movement.previousStock).toBe(initialStock);
      expect(movement.newStock).toBe(initialStock - 10);

      // Kiểm tra product stock đã được cập nhật
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stock).toBe(initialStock - 10);
    });

    it('should handle order type (decrease stock)', async () => {
      const initialStock = testProduct.stock;
      
      const movement = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'order',
        quantity: 5,
        reason: 'Đơn hàng #123',
        createdBy: testUser._id
      });

      expect(movement.newStock).toBe(initialStock - 5);
    });

    it('should handle cancel type (increase stock)', async () => {
      const initialStock = testProduct.stock;
      
      const movement = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'cancel',
        quantity: 5,
        reason: 'Hủy đơn hàng #123',
        createdBy: testUser._id
      });

      expect(movement.newStock).toBe(initialStock + 5);
    });

    it('should handle return type (increase stock)', async () => {
      const initialStock = testProduct.stock;
      
      const movement = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'return',
        quantity: 3,
        reason: 'Hoàn trả từ khách',
        createdBy: testUser._id
      });

      expect(movement.newStock).toBe(initialStock + 3);
    });

    it('should handle adjustment type correctly', async () => {
      const initialStock = testProduct.stock;
      
      // Adjustment với số dương
      const movement1 = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'adjustment',
        quantity: 5,
        reason: 'Điều chỉnh tăng',
        createdBy: testUser._id
      });
      expect(movement1.newStock).toBe(initialStock + 5);

      // Adjustment với số âm
      const movement2 = await StockMovement.createMovement({
        product: testProduct._id,
        type: 'adjustment',
        quantity: -3,
        reason: 'Điều chỉnh giảm',
        createdBy: testUser._id
      });
      expect(movement2.newStock).toBe(initialStock + 5 - 3);
    });

    it('should throw error if product not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(StockMovement.createMovement({
        product: fakeId,
        type: 'import',
        quantity: 10,
        reason: 'Test',
        createdBy: testUser._id
      })).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('should prevent negative stock for export', async () => {
      await expect(StockMovement.createMovement({
        product: testProduct._id,
        type: 'export',
        quantity: 100,  // Nhiều hơn stock hiện tại (50)
        reason: 'Xuất kho lớn',
        createdBy: testUser._id
      })).rejects.toThrow('Không đủ tồn kho');
    });

    it('should prevent negative stock for order', async () => {
      await expect(StockMovement.createMovement({
        product: testProduct._id,
        type: 'order',
        quantity: 100,
        reason: 'Đơn hàng lớn',
        createdBy: testUser._id
      })).rejects.toThrow('Không đủ tồn kho');
    });
  });

  describe('getProductHistory Static Method', () => {
    beforeEach(async () => {
      // Tạo một số movements
      await StockMovement.createMovement({
        product: testProduct._id,
        type: 'import',
        quantity: 20,
        reason: 'Nhập 1',
        createdBy: testUser._id
      });
      await StockMovement.createMovement({
        product: testProduct._id,
        type: 'export',
        quantity: 5,
        reason: 'Xuất 1',
        createdBy: testUser._id
      });
      await StockMovement.createMovement({
        product: testProduct._id,
        type: 'import',
        quantity: 10,
        reason: 'Nhập 2',
        createdBy: testUser._id
      });
    });

    it('should get movement history for product', async () => {
      const history = await StockMovement.getProductHistory(testProduct._id);
      
      expect(history).toHaveLength(3);
      // Sorted by createdAt desc
      expect(history[0].reason).toBe('Nhập 2');
    });

    it('should filter by type', async () => {
      const importHistory = await StockMovement.getProductHistory(testProduct._id, { type: 'import' });
      
      expect(importHistory).toHaveLength(2);
      importHistory.forEach(m => {
        expect(m.type).toBe('import');
      });
    });

    it('should limit results', async () => {
      const history = await StockMovement.getProductHistory(testProduct._id, { limit: 2 });
      
      expect(history).toHaveLength(2);
    });
  });

  describe('getSummary Static Method', () => {
    beforeEach(async () => {
      await StockMovement.createMovement({
        product: testProduct._id,
        type: 'import',
        quantity: 100,
        reason: 'Nhập',
        createdBy: testUser._id
      });
      await StockMovement.createMovement({
        product: testProduct._id,
        type: 'export',
        quantity: 20,
        reason: 'Xuất',
        createdBy: testUser._id
      });
      await StockMovement.createMovement({
        product: testProduct._id,
        type: 'order',
        quantity: 10,
        reason: 'Đơn hàng',
        createdBy: testUser._id
      });
    });

    it('should get movement summary', async () => {
      const summary = await StockMovement.getSummary({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(summary).toBeDefined();
      // Summary should contain aggregated data by type
      expect(Array.isArray(summary)).toBe(true);
    });
  });

  describe('Virtuals', () => {
    it('should display positive quantity with + prefix', async () => {
      const movement = await StockMovement.create({
        product: testProduct._id,
        type: 'import',
        quantity: 10,
        previousStock: 50,
        newStock: 60,
        reason: 'Test',
        createdBy: testUser._id
      });

      expect(movement.quantityDisplay).toBe('+10');
    });

    it('should display negative quantity with - prefix', async () => {
      const movement = await StockMovement.create({
        product: testProduct._id,
        type: 'export',
        quantity: -10,
        previousStock: 50,
        newStock: 40,
        reason: 'Test',
        createdBy: testUser._id
      });

      expect(movement.quantityDisplay).toBe('-10');
    });
  });
});
