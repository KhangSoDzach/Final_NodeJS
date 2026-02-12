/**
 * Unit Tests cho Product Model - Inventory Features
 */

const mongoose = require('mongoose');
const Product = require('../../models/product');

describe('Product Model - Inventory Features Tests', () => {
  describe('Inventory Schema Fields', () => {
    it('should create product with default lowStockThreshold', async () => {
      const product = await Product.create({
        name: 'Test Product',
        slug: 'test-product-threshold',
        description: 'Test Description',
        price: 1000000,
        stock: 50,
        category: 'laptop',
        brand: 'test-brand'
      });

      expect(product.lowStockThreshold).toBe(10); // Default value
    });

    it('should create product with custom lowStockThreshold', async () => {
      const product = await Product.create({
        name: 'Custom Threshold Product',
        slug: 'custom-threshold',
        description: 'Test',
        price: 1000000,
        stock: 100,
        category: 'laptop',
        brand: 'test',
        lowStockThreshold: 20
      });

      expect(product.lowStockThreshold).toBe(20);
    });

    it('should create product with allowPreOrder option', async () => {
      const product = await Product.create({
        name: 'PreOrder Product',
        slug: 'preorder-product',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        allowPreOrder: true
      });

      expect(product.allowPreOrder).toBe(true);
    });

    it('should default allowPreOrder to false', async () => {
      const product = await Product.create({
        name: 'No PreOrder Product',
        slug: 'no-preorder',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test'
      });

      expect(product.allowPreOrder).toBe(false);
    });

    it('should store SKU field', async () => {
      const product = await Product.create({
        name: 'SKU Product',
        slug: 'sku-product',
        description: 'Test',
        price: 1000000,
        stock: 10,
        category: 'laptop',
        brand: 'test',
        sku: 'PROD-001-ABC'
      });

      expect(product.sku).toBe('PROD-001-ABC');
    });

    it('should store estimatedRestockDate', async () => {
      const restockDate = new Date('2025-02-01');
      const product = await Product.create({
        name: 'Restock Product',
        slug: 'restock-product',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        estimatedRestockDate: restockDate
      });

      expect(product.estimatedRestockDate).toEqual(restockDate);
    });
  });

  describe('Stock Status Virtual Fields', () => {
    it('should return isLowStock=true when stock <= threshold', async () => {
      const product = await Product.create({
        name: 'Low Stock Product',
        slug: 'low-stock',
        description: 'Test',
        price: 1000000,
        stock: 5,
        category: 'laptop',
        brand: 'test',
        lowStockThreshold: 10
      });

      expect(product.isLowStock).toBe(true);
    });

    it('should return isLowStock=false when stock > threshold', async () => {
      const product = await Product.create({
        name: 'Enough Stock Product',
        slug: 'enough-stock',
        description: 'Test',
        price: 1000000,
        stock: 50,
        category: 'laptop',
        brand: 'test',
        lowStockThreshold: 10
      });

      expect(product.isLowStock).toBe(false);
    });

    it('should return isOutOfStock=true when stock <= 0', async () => {
      const product = await Product.create({
        name: 'Out of Stock Product',
        slug: 'out-of-stock',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test'
      });

      expect(product.isOutOfStock).toBe(true);
    });

    it('should return isOutOfStock=false when stock > 0', async () => {
      const product = await Product.create({
        name: 'In Stock Product',
        slug: 'in-stock',
        description: 'Test',
        price: 1000000,
        stock: 1,
        category: 'laptop',
        brand: 'test'
      });

      expect(product.isOutOfStock).toBe(false);
    });

    it('should return correct stockStatus for out-of-stock with pre-order', async () => {
      const product = await Product.create({
        name: 'Out Pre-Order',
        slug: 'out-preorder',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        allowPreOrder: true
      });

      expect(product.stockStatus).toBe('pre-order');
    });

    it('should return correct stockStatus for out-of-stock without pre-order', async () => {
      const product = await Product.create({
        name: 'Out No Pre-Order',
        slug: 'out-no-preorder',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        allowPreOrder: false
      });

      expect(product.stockStatus).toBe('out-of-stock');
    });

    it('should return correct stockStatus for low-stock', async () => {
      const product = await Product.create({
        name: 'Low Status',
        slug: 'low-status',
        description: 'Test',
        price: 1000000,
        stock: 5,
        category: 'laptop',
        brand: 'test',
        lowStockThreshold: 10
      });

      expect(product.stockStatus).toBe('low-stock');
    });

    it('should return correct stockStatus for in-stock', async () => {
      const product = await Product.create({
        name: 'In Status',
        slug: 'in-status',
        description: 'Test',
        price: 1000000,
        stock: 100,
        category: 'laptop',
        brand: 'test',
        lowStockThreshold: 10
      });

      expect(product.stockStatus).toBe('in-stock');
    });
  });

  describe('Stock Operations', () => {
    it('should update stock correctly', async () => {
      const product = await Product.create({
        name: 'Update Stock',
        slug: 'update-stock',
        description: 'Test',
        price: 1000000,
        stock: 50,
        category: 'laptop',
        brand: 'test'
      });

      product.stock = 30;
      await product.save();

      const updated = await Product.findById(product._id);
      expect(updated.stock).toBe(30);
    });

    it('should not allow negative stock', async () => {
      const product = await Product.create({
        name: 'Negative Stock',
        slug: 'negative-stock',
        description: 'Test',
        price: 1000000,
        stock: 10,
        category: 'laptop',
        brand: 'test'
      });

      product.stock = -5;
      
      await expect(product.save()).rejects.toThrow();
    });
  });

  describe('Query with Inventory Filters', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Product Low',
          slug: 'product-low',
          description: 'Test',
          price: 1000000,
          stock: 5,
          category: 'laptop',
          brand: 'test',
          lowStockThreshold: 10
        },
        {
          name: 'Product Out',
          slug: 'product-out',
          description: 'Test',
          price: 1000000,
          stock: 0,
          category: 'laptop',
          brand: 'test',
          lowStockThreshold: 10
        },
        {
          name: 'Product Enough',
          slug: 'product-enough',
          description: 'Test',
          price: 1000000,
          stock: 50,
          category: 'laptop',
          brand: 'test',
          lowStockThreshold: 10
        }
      ]);
    });

    it('should query products with low stock using $expr', async () => {
      const lowStockProducts = await Product.find({
        $expr: {
          $and: [
            { $gt: ['$stock', 0] },
            { $lte: ['$stock', '$lowStockThreshold'] }
          ]
        }
      });

      expect(lowStockProducts).toHaveLength(1);
      expect(lowStockProducts[0].name).toBe('Product Low');
    });

    it('should query out of stock products', async () => {
      const outOfStockProducts = await Product.find({ stock: { $lte: 0 } });

      expect(outOfStockProducts).toHaveLength(1);
      expect(outOfStockProducts[0].name).toBe('Product Out');
    });

    it('should query in stock products', async () => {
      const inStockProducts = await Product.find({ stock: { $gt: 0 } });

      expect(inStockProducts).toHaveLength(2);
    });

    it('should query products with pre-order enabled', async () => {
      await Product.create({
        name: 'PreOrder Enabled',
        slug: 'preorder-enabled',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        allowPreOrder: true
      });

      const preOrderProducts = await Product.find({ allowPreOrder: true });
      expect(preOrderProducts).toHaveLength(1);
      expect(preOrderProducts[0].name).toBe('PreOrder Enabled');
    });
  });

  describe('Variant Stock Management', () => {
    it('should handle variant with stock', async () => {
      const product = await Product.create({
        name: 'Variant Product',
        slug: 'variant-product',
        description: 'Test',
        price: 1000000,
        stock: 0,  // Main stock
        category: 'laptop',
        brand: 'test',
        variants: [
          {
            name: 'Color',
            options: [
              { value: 'Red', stock: 10, additionalPrice: 0 },
              { value: 'Blue', stock: 5, additionalPrice: 50000 }
            ]
          }
        ]
      });

      expect(product.variants[0].options[0].stock).toBe(10);
      expect(product.variants[0].options[1].stock).toBe(5);
    });

    it('should calculate total variant stock', async () => {
      const product = await Product.create({
        name: 'Total Variant Stock',
        slug: 'total-variant-stock',
        description: 'Test',
        price: 1000000,
        stock: 0,
        category: 'laptop',
        brand: 'test',
        variants: [
          {
            name: 'Size',
            options: [
              { value: 'S', stock: 10 },
              { value: 'M', stock: 20 },
              { value: 'L', stock: 15 }
            ]
          }
        ]
      });

      // Calculate total manually for test
      const totalStock = product.variants[0].options.reduce((sum, opt) => sum + opt.stock, 0);
      expect(totalStock).toBe(45);
    });
  });
});
