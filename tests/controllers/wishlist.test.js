/**
 * Wishlist Controller Tests
 * Tests cho Wishlist API endpoints
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Wishlist = require('../../models/wishlist');
const Product = require('../../models/product');
const User = require('../../models/user');
const wishlistController = require('../../controllers/wishlist');

describe('Wishlist Controller', () => {
  let app;
  let testUser;
  let testProducts = [];

  beforeAll(async () => {
    // Create express app for testing
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = testUser;
      req.flash = jest.fn();
      next();
    });

    // Setup routes
    app.get('/wishlist', wishlistController.getWishlist);
    app.get('/wishlist/count', wishlistController.getWishlistCount);
    app.post('/wishlist/add', wishlistController.addToWishlist);
    app.get('/wishlist/check/:productId', wishlistController.checkWishlist);
    app.delete('/wishlist/remove/:productId', wishlistController.removeFromWishlist);
    app.post('/wishlist/clear', wishlistController.clearWishlist);
    app.post('/wishlist/move-to-cart/:productId', wishlistController.moveToCart);

    // Mock render
    app.set('view engine', 'ejs');
  });

  beforeEach(async () => {
    // Clean up
    await Wishlist.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    testProducts = [];

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'wishlist-ctrl@test.com',
      password: 'Password123',
      phone: '0123456789',
      role: 'customer'
    });

    // Create test products
    for (let i = 1; i <= 3; i++) {
      const product = await Product.create({
        name: `Test Product ${i}`,
        slug: `test-product-${i}`,
        description: `Test product description ${i}`,
        price: 5000000 * i,
        discountPrice: i === 2 ? 4000000 * i : null,
        category: 'Laptop',
        brand: `Brand ${i}`,
        stock: 10,
        sku: `PROD-${i}`,
        images: [`/image/product-${i}.jpg`]
      });
      testProducts.push(product);
    }
  });

  describe('POST /wishlist/add', () => {
    it('should add product to wishlist', async () => {
      const res = await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[0]._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đã thêm vào danh sách yêu thích');
      expect(res.body.itemCount).toBe(1);
    });

    it('should not add duplicate product', async () => {
      // Add first time
      await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[0]._id.toString() });

      // Try to add again
      const res = await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[0]._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sản phẩm đã có trong danh sách yêu thích');
    });

    it('should return 400 for missing productId', async () => {
      const res = await request(app)
        .post('/wishlist/add')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Thiếu thông tin sản phẩm');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .post('/wishlist/add')
        .send({ productId: fakeId.toString() });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Không tìm thấy sản phẩm');
    });

    it('should add multiple different products', async () => {
      await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[0]._id.toString() });

      await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[1]._id.toString() });

      const res = await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[2]._id.toString() });

      expect(res.body.itemCount).toBe(3);
    });
  });

  describe('DELETE /wishlist/remove/:productId', () => {
    beforeEach(async () => {
      // Add product to wishlist first
      const wishlist = await Wishlist.findOrCreate(testUser._id);
      await wishlist.addProduct(testProducts[0]._id, testProducts[0].price);
    });

    it('should remove product from wishlist', async () => {
      const res = await request(app)
        .delete(`/wishlist/remove/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đã xóa khỏi danh sách yêu thích');
    });

    it('should return error for product not in wishlist', async () => {
      const res = await request(app)
        .delete(`/wishlist/remove/${testProducts[1]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /wishlist/check/:productId', () => {
    it('should return false for product not in wishlist', async () => {
      const res = await request(app)
        .get(`/wishlist/check/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.inWishlist).toBe(false);
    });

    it('should return true for product in wishlist', async () => {
      // Add product first
      const wishlist = await Wishlist.findOrCreate(testUser._id);
      await wishlist.addProduct(testProducts[0]._id, testProducts[0].price);

      const res = await request(app)
        .get(`/wishlist/check/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.inWishlist).toBe(true);
    });
  });

  describe('GET /wishlist/count', () => {
    it('should return 0 for empty wishlist', async () => {
      const res = await request(app).get('/wishlist/count');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });

    it('should return correct count', async () => {
      const wishlist = await Wishlist.findOrCreate(testUser._id);
      await wishlist.addProduct(testProducts[0]._id, testProducts[0].price);
      await wishlist.addProduct(testProducts[1]._id, testProducts[1].price);

      const res = await request(app).get('/wishlist/count');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  describe('Price Tracking', () => {
    it('should store price when product is added', async () => {
      const originalPrice = testProducts[0].price;

      await request(app)
        .post('/wishlist/add')
        .send({ productId: testProducts[0]._id.toString() });

      const wishlist = await Wishlist.findOne({ user: testUser._id });
      expect(wishlist.items[0].priceWhenAdded).toBe(originalPrice);
    });

    it('should detect price drop', async () => {
      // Add product at original price
      const wishlist = await Wishlist.findOrCreate(testUser._id);
      await wishlist.addProduct(testProducts[0]._id, 10000000); // Higher price when added

      // Update product price
      await Product.findByIdAndUpdate(testProducts[0]._id, { price: 8000000 });

      // Reload and check
      await wishlist.populate('items.product');
      const discounted = await wishlist.getDiscountedProducts();

      expect(discounted.length).toBeGreaterThan(0);
    });
  });
});

describe('Wishlist Integration Tests', () => {
  let testUser;
  let testProduct;

  beforeEach(async () => {
    await Wishlist.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create({
      name: 'Integration User',
      email: 'integration@test.com',
      password: 'Password123',
      phone: '0123456789',
      role: 'customer'
    });

    testProduct = await Product.create({
      name: 'Integration Product',
      slug: 'integration-product',
      description: 'Product for integration testing',
      price: 15000000,
      discountPrice: 12000000,
      category: 'Laptop',
      stock: 10,
      sku: 'INT-001',
      brand: 'Test Brand'
    });
  });

  it('should handle concurrent add operations', async () => {
    const wishlist = await Wishlist.findOrCreate(testUser._id);
    
    // Simulate concurrent adds
    const results = await Promise.all([
      wishlist.addProduct(testProduct._id, testProduct.price),
      wishlist.addProduct(testProduct._id, testProduct.price),
      wishlist.addProduct(testProduct._id, testProduct.price)
    ]);

    // Only first should succeed
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBe(1);
  });

  it('should maintain wishlist integrity across operations', async () => {
    const wishlist = await Wishlist.findOrCreate(testUser._id);

    // Add product
    await wishlist.addProduct(testProduct._id, testProduct.price);
    expect(wishlist.items).toHaveLength(1);

    // Remove product
    await wishlist.removeProduct(testProduct._id);
    expect(wishlist.items).toHaveLength(0);

    // Add again
    await wishlist.addProduct(testProduct._id, testProduct.price);
    expect(wishlist.items).toHaveLength(1);
  });

  it('should handle product deletion gracefully', async () => {
    const wishlist = await Wishlist.findOrCreate(testUser._id);
    await wishlist.addProduct(testProduct._id, testProduct.price);

    // Delete the product
    await Product.findByIdAndDelete(testProduct._id);

    // Wishlist should still exist but product reference will be null
    await wishlist.populate('items.product');
    expect(wishlist.items[0].product).toBeNull();
  });
});
