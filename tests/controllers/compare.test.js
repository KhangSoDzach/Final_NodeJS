/**
 * Compare Controller Tests
 * Tests cho Compare functionality (session-based)
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const compareController = require('../../controllers/compare');
const Product = require('../../models/product');

describe('Compare Controller', () => {
  let app;
  let testProducts = [];

  beforeAll(async () => {
    // Create express app for testing
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true
    }));

    // Setup routes
    app.get('/compare', compareController.getComparePage);
    app.get('/compare/list', compareController.getCompareList);
    app.get('/compare/check/:productId', compareController.checkInCompare);
    app.post('/compare/add', compareController.addToCompare);
    app.delete('/compare/remove/:productId', compareController.removeFromCompare);
    app.post('/compare/clear', compareController.clearCompare);

    // Mock render
    app.set('view engine', 'ejs');
    app.set('views', './views');
  });

  beforeEach(async () => {
    // Clean up
    await Product.deleteMany({});
    testProducts = [];

    // Create test products in same category
    for (let i = 1; i <= 5; i++) {
      const product = await Product.create({
        name: `Test Laptop ${i}`,
        slug: `test-laptop-${i}`,
        description: `Test laptop description ${i}`,
        price: 10000000 + (i * 1000000),
        category: 'Laptop',
        brand: `Brand ${i}`,
        stock: 10,
        sku: `LAPTOP-${i}`,
        specifications: [
          { name: 'CPU', value: `Intel Core i${i + 4}` },
          { name: 'RAM', value: `${8 + (i * 2)}GB` },
          { name: 'Storage', value: `${256 * i}GB SSD` }
        ]
      });
      testProducts.push(product);
    }
  });

  describe('POST /compare/add', () => {
    it('should add product to compare list', async () => {
      const res = await request(app)
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.category).toBe('Laptop');
    });

    it('should not add duplicate product', async () => {
      const agent = request.agent(app);

      await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });

      const res = await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sản phẩm đã có trong danh sách so sánh');
    });

    it('should not exceed max 4 products', async () => {
      const agent = request.agent(app);

      // Add 4 products
      for (let i = 0; i < 4; i++) {
        await agent
          .post('/compare/add')
          .send({ productId: testProducts[i]._id.toString() });
      }

      // Try to add 5th product
      const res = await agent
        .post('/compare/add')
        .send({ productId: testProducts[4]._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Chỉ được so sánh tối đa 4 sản phẩm');
    });

    it('should not allow products from different categories', async () => {
      const agent = request.agent(app);

      // Add first product (Laptop)
      await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });

      // Create product in different category
      const pcProduct = await Product.create({
        name: 'Test PC',
        slug: 'test-pc',
        description: 'A test PC',
        price: 20000000,
        category: 'PC',
        brand: 'Test Brand',
        stock: 5,
        sku: 'PC-001'
      });

      // Try to add PC product
      const res = await agent
        .post('/compare/add')
        .send({ productId: pcProduct._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cùng danh mục');
    });

    it('should return 400 for missing productId', async () => {
      const res = await request(app)
        .post('/compare/add')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Thiếu thông tin sản phẩm');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .post('/compare/add')
        .send({ productId: fakeId.toString() });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Không tìm thấy sản phẩm');
    });
  });

  describe('DELETE /compare/remove/:productId', () => {
    it('should remove product from compare list', async () => {
      const agent = request.agent(app);

      // Add product first
      await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });

      // Remove product
      const res = await agent
        .delete(`/compare/remove/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
    });

    it('should return 404 for product not in list', async () => {
      const res = await request(app)
        .delete(`/compare/remove/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /compare/list', () => {
    it('should return empty list initially', async () => {
      const res = await request(app).get('/compare/list');

      expect(res.status).toBe(200);
      expect(res.body.products).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('should return products in compare list', async () => {
      const agent = request.agent(app);

      // Add products
      await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });
      await agent
        .post('/compare/add')
        .send({ productId: testProducts[1]._id.toString() });

      const res = await agent.get('/compare/list');

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(res.body.count).toBe(2);
      expect(res.body.category).toBe('Laptop');
    });
  });

  describe('GET /compare/check/:productId', () => {
    it('should return false for product not in list', async () => {
      const res = await request(app)
        .get(`/compare/check/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.inCompare).toBe(false);
    });

    it('should return true for product in list', async () => {
      const agent = request.agent(app);

      await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });

      const res = await agent
        .get(`/compare/check/${testProducts[0]._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.inCompare).toBe(true);
    });
  });

  describe('POST /compare/clear', () => {
    it('should clear all products from compare list', async () => {
      const agent = request.agent(app);

      // Add products
      await agent
        .post('/compare/add')
        .send({ productId: testProducts[0]._id.toString() });
      await agent
        .post('/compare/add')
        .send({ productId: testProducts[1]._id.toString() });

      // Clear
      const res = await agent
        .post('/compare/clear')
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cleared
      const listRes = await agent.get('/compare/list');
      expect(listRes.body.count).toBe(0);
    });
  });

  describe('Compare Page Rendering', () => {
    it('should handle empty compare list gracefully', async () => {
      // Mock res.render
      const mockRender = jest.fn();
      const mockReq = {
        session: { compareList: { products: [], category: null } }
      };
      const mockRes = {
        render: mockRender
      };

      await compareController.getComparePage(mockReq, mockRes);

      expect(mockRender).toHaveBeenCalledWith('products/compare', expect.objectContaining({
        title: 'So sánh sản phẩm',
        products: [],
        specifications: [],
        category: null
      }));
    });
  });
});

describe('Compare Integration', () => {
  let testProducts = [];

  beforeEach(async () => {
    await Product.deleteMany({});
    testProducts = [];

    // Create test products
    for (let i = 1; i <= 3; i++) {
      const product = await Product.create({
        name: `Laptop ${i}`,
        slug: `laptop-${i}`,
        description: `Description ${i}`,
        price: 10000000 * i,
        discountPrice: i === 2 ? 8000000 * i : null,
        category: 'Laptop',
        brand: `Brand ${i}`,
        stock: i * 5,
        sku: `LP-00${i}`,
        specifications: [
          { name: 'CPU', value: `Intel i${i + 4}` },
          { name: 'RAM', value: `${8 * i}GB` }
        ]
      });
      testProducts.push(product);
    }
  });

  it('should generate correct specifications comparison', async () => {
    const products = await Product.find({}).lean();
    
    // Simulate specification aggregation
    const allSpecs = new Map();
    products.forEach(product => {
      product.specifications?.forEach(spec => {
        if (!allSpecs.has(spec.name)) {
          allSpecs.set(spec.name, []);
        }
      });
    });

    const specifications = Array.from(allSpecs.keys()).map(specName => {
      const values = products.map(product => {
        const spec = product.specifications?.find(s => s.name === specName);
        return spec ? spec.value : '-';
      });
      return { name: specName, values };
    });

    expect(specifications).toHaveLength(2);
    expect(specifications.find(s => s.name === 'CPU').values).toHaveLength(3);
    expect(specifications.find(s => s.name === 'RAM').values).toHaveLength(3);
  });

  it('should identify best price correctly', () => {
    const prices = testProducts.map(p => p.discountPrice || p.price);
    const minPrice = Math.min(...prices);

    expect(minPrice).toBe(10000000); // First product has lowest price
  });
});
