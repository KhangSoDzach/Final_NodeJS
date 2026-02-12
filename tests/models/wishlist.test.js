/**
 * Wishlist Model Tests
 * Tests cho model Wishlist sử dụng mock database
 */

const mongoose = require('mongoose');
const Wishlist = require('../../models/wishlist');
const Product = require('../../models/product');
const User = require('../../models/user');

describe('Wishlist Model', () => {
  let testUser;
  let testProduct;

  beforeEach(async () => {
    // Clean up
    await Wishlist.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'wishlist@test.com',
      password: 'Password123',
      phone: '0123456789',
      role: 'customer'
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Laptop',
      slug: 'test-laptop',
      description: 'A test laptop for testing',
      price: 15000000,
      discountPrice: 14000000,
      category: 'Laptop',
      brand: 'Test Brand',
      stock: 10,
      sku: 'TEST-001'
    });
  });

  describe('Schema Validation', () => {
    it('should create a valid wishlist', async () => {
      const wishlist = await Wishlist.create({
        user: testUser._id,
        items: [{
          product: testProduct._id,
          priceWhenAdded: testProduct.price
        }]
      });

      expect(wishlist).toBeDefined();
      expect(wishlist.user.toString()).toBe(testUser._id.toString());
      expect(wishlist.items).toHaveLength(1);
      expect(wishlist.items[0].product.toString()).toBe(testProduct._id.toString());
    });

    it('should require user field', async () => {
      const wishlist = new Wishlist({
        items: [{
          product: testProduct._id,
          priceWhenAdded: testProduct.price
        }]
      });

      await expect(wishlist.save()).rejects.toThrow();
    });

    it('should set default addedAt timestamp', async () => {
      const wishlist = await Wishlist.create({
        user: testUser._id,
        items: [{
          product: testProduct._id,
          priceWhenAdded: testProduct.price
        }]
      });

      expect(wishlist.items[0].addedAt).toBeDefined();
      expect(wishlist.items[0].addedAt instanceof Date).toBe(true);
    });

    it('should enforce unique user constraint', async () => {
      await Wishlist.create({
        user: testUser._id,
        items: []
      });

      const duplicateWishlist = new Wishlist({
        user: testUser._id,
        items: []
      });

      await expect(duplicateWishlist.save()).rejects.toThrow();
    });
  });

  describe('Instance Methods', () => {
    let wishlist;

    beforeEach(async () => {
      wishlist = await Wishlist.create({
        user: testUser._id,
        items: []
      });
    });

    describe('hasProduct()', () => {
      it('should return false when product is not in wishlist', () => {
        const result = wishlist.hasProduct(testProduct._id);
        expect(result).toBe(false);
      });

      it('should return true when product is in wishlist', async () => {
        wishlist.items.push({
          product: testProduct._id,
          priceWhenAdded: testProduct.price
        });
        await wishlist.save();

        const result = wishlist.hasProduct(testProduct._id);
        expect(result).toBe(true);
      });

      it('should work with string product ID', async () => {
        wishlist.items.push({
          product: testProduct._id,
          priceWhenAdded: testProduct.price
        });
        await wishlist.save();

        const result = wishlist.hasProduct(testProduct._id.toString());
        expect(result).toBe(true);
      });
    });

    describe('addProduct()', () => {
      it('should add product to wishlist', async () => {
        const result = await wishlist.addProduct(testProduct._id, testProduct.price);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Đã thêm vào danh sách yêu thích');
        expect(wishlist.items).toHaveLength(1);
      });

      it('should not add duplicate product', async () => {
        await wishlist.addProduct(testProduct._id, testProduct.price);
        const result = await wishlist.addProduct(testProduct._id, testProduct.price);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Sản phẩm đã có trong danh sách yêu thích');
        expect(wishlist.items).toHaveLength(1);
      });

      it('should store price when added', async () => {
        const priceWhenAdded = 20000000;
        await wishlist.addProduct(testProduct._id, priceWhenAdded);

        expect(wishlist.items[0].priceWhenAdded).toBe(priceWhenAdded);
      });
    });

    describe('removeProduct()', () => {
      beforeEach(async () => {
        await wishlist.addProduct(testProduct._id, testProduct.price);
      });

      it('should remove product from wishlist', async () => {
        const result = await wishlist.removeProduct(testProduct._id);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Đã xóa khỏi danh sách yêu thích');
        expect(wishlist.items).toHaveLength(0);
      });

      it('should handle removing non-existent product', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const result = await wishlist.removeProduct(fakeId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Sản phẩm không có trong danh sách yêu thích');
      });
    });

    describe('getDiscountedProducts()', () => {
      it('should return products with price drop', async () => {
        // Add product with higher price when added
        wishlist.items.push({
          product: testProduct._id,
          priceWhenAdded: 20000000, // Higher than current price
          addedAt: new Date()
        });
        await wishlist.save();
        await wishlist.populate('items.product');

        const discounted = await wishlist.getDiscountedProducts();

        expect(discounted).toHaveLength(1);
        expect(discounted[0].product._id.toString()).toBe(testProduct._id.toString());
      });

      it('should not return products without price drop', async () => {
        // Add product with lower price when added
        wishlist.items.push({
          product: testProduct._id,
          priceWhenAdded: 10000000, // Lower than current price
          addedAt: new Date()
        });
        await wishlist.save();
        await wishlist.populate('items.product');

        const discounted = await wishlist.getDiscountedProducts();

        expect(discounted).toHaveLength(0);
      });
    });
  });

  describe('Static Methods', () => {
    describe('findOrCreate()', () => {
      it('should create new wishlist if not exists', async () => {
        const wishlist = await Wishlist.findOrCreate(testUser._id);

        expect(wishlist).toBeDefined();
        expect(wishlist.user.toString()).toBe(testUser._id.toString());
        expect(wishlist.items).toHaveLength(0);
      });

      it('should return existing wishlist', async () => {
        const original = await Wishlist.create({
          user: testUser._id,
          items: [{
            product: testProduct._id,
            priceWhenAdded: testProduct.price
          }]
        });

        const found = await Wishlist.findOrCreate(testUser._id);

        expect(found._id.toString()).toBe(original._id.toString());
        expect(found.items).toHaveLength(1);
      });
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate itemCount correctly', async () => {
      const wishlist = await Wishlist.create({
        user: testUser._id,
        items: [
          { product: testProduct._id, priceWhenAdded: 100 },
        ]
      });

      // Create another product for second item
      const product2 = await Product.create({
        name: 'Test Product 2',
        slug: 'test-product-2',
        description: 'Another test product',
        price: 5000000,
        category: 'PC',
        stock: 5,
        sku: 'TEST-002',
        brand: 'Test Brand'
      });

      wishlist.items.push({ product: product2._id, priceWhenAdded: 200 });
      await wishlist.save();

      expect(wishlist.itemCount).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty wishlist', async () => {
      const wishlist = await Wishlist.create({
        user: testUser._id,
        items: []
      });

      expect(wishlist.itemCount).toBe(0);
      expect(wishlist.hasProduct(testProduct._id)).toBe(false);
    });

    it('should handle invalid product ID gracefully', async () => {
      const wishlist = await Wishlist.create({
        user: testUser._id,
        items: []
      });

      expect(wishlist.hasProduct('invalid-id')).toBe(false);
    });
  });
});
