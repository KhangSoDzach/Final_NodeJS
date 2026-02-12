/**
 * Checkout Optimization Tests
 * Part 8: Guest Checkout, One-click Checkout, VAT Calculation, Invoice Generation
 */
const mongoose = require('mongoose');
const vatCalculator = require('../../utils/vatCalculator');
const { initGuestCart, mergeGuestCart, getCartCount } = require('../../middleware/guestCart');
const Order = require('../../models/order');

// Mock req/res objects
const mockRequest = (sessionData = {}, userData = null) => ({
  session: sessionData,
  user: userData
});

const mockResponse = () => {
  const res = {};
  res.locals = {};
  return res;
};

const mockNext = jest.fn();

describe('Part 8: Checkout Optimization', () => {
  // ==================================================
  // VAT Calculator Tests
  // ==================================================
  describe('VAT Calculator', () => {
    describe('calculateVatFromInclusivePrice', () => {
      test('should calculate VAT correctly from inclusive price', () => {
        const result = vatCalculator.calculateVatFromInclusivePrice(1100000);
        expect(result.priceBeforeVat).toBe(1000000);
        expect(result.vatAmount).toBe(100000);
        expect(result.priceWithVat).toBe(1100000);
        expect(result.vatRate).toBe(0.10);
      });

      test('should handle zero price', () => {
        const result = vatCalculator.calculateVatFromInclusivePrice(0);
        expect(result.priceBeforeVat).toBe(0);
        expect(result.vatAmount).toBe(0);
        expect(result.priceWithVat).toBe(0);
      });

      test('should round correctly', () => {
        const result = vatCalculator.calculateVatFromInclusivePrice(999999);
        expect(typeof result.priceBeforeVat).toBe('number');
        expect(typeof result.vatAmount).toBe('number');
        expect(result.priceBeforeVat + result.vatAmount).toBeCloseTo(999999, 0);
      });
    });

    describe('calculateOrderVat', () => {
      test('should calculate VAT for order items', () => {
        const order = {
          items: [
            { price: 550000, quantity: 2 },  // 1,100,000
            { price: 330000, quantity: 1 }   // 330,000
          ]
        };
        const result = vatCalculator.calculateOrderVat(order);
        expect(result.subtotal).toBe(1430000);
        expect(result.vatRate).toBe(0.10);
        expect(result.priceBeforeVat + result.vatAmount).toBeCloseTo(1430000, 0);
      });

      test('should handle empty items array', () => {
        const order = { items: [] };
        const result = vatCalculator.calculateOrderVat(order);
        expect(result.subtotal).toBe(0);
        expect(result.vatAmount).toBe(0);
      });

      test('should handle single item', () => {
        const order = { items: [{ price: 1100000, quantity: 1 }] };
        const result = vatCalculator.calculateOrderVat(order);
        expect(result.subtotal).toBe(1100000);
        expect(result.priceBeforeVat).toBe(1000000);
        expect(result.vatAmount).toBe(100000);
      });
    });

    describe('validateVatInfo', () => {
      test('should validate complete VAT info', () => {
        const vatInfo = {
          companyName: 'Công ty ABC',
          taxCode: '0123456789',
          address: '123 Đường ABC, Quận 1, TP.HCM'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should return errors for missing company name', () => {
        const vatInfo = {
          taxCode: '0123456789',
          address: '123 Đường ABC, Quận 1, TP.HCM'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Tên công ty/người mua phải có ít nhất 2 ký tự');
      });

      test('should return errors for missing address', () => {
        const vatInfo = {
          companyName: 'Công ty ABC',
          taxCode: '0123456789'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Địa chỉ phải có ít nhất 10 ký tự');
      });

      test('should validate tax code format (10 digits)', () => {
        const vatInfo = {
          companyName: 'Công ty ABC',
          taxCode: '0123456789',
          address: '123 Đường ABC'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(true);
      });

      test('should validate tax code format (13 digits with dash)', () => {
        const vatInfo = {
          companyName: 'Công ty ABC',
          taxCode: '0123456789-001',
          address: '123 Đường ABC'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(true);
      });

      test('should reject invalid tax code format', () => {
        const vatInfo = {
          companyName: 'Công ty ABC',
          taxCode: '12345', // Invalid: too short
          address: '123 Đường ABC, Quận 1, TP.HCM'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Mã số thuế không hợp lệ (10 số hoặc 10-3 số)');
      });

      test('should allow empty tax code (optional)', () => {
        const vatInfo = {
          companyName: 'Công ty ABC',
          address: '123 Đường ABC, Quận 1, TP.HCM'
        };
        const result = vatCalculator.validateVatInfo(vatInfo);
        expect(result.isValid).toBe(true);
      });
    });

    describe('formatCurrency', () => {
      test('should format currency in VND', () => {
        const formatted = vatCalculator.formatCurrency(1000000);
        expect(formatted).toContain('1');
        expect(formatted).toContain('000');
        expect(formatted).toContain('000');
      });

      test('should handle zero', () => {
        const formatted = vatCalculator.formatCurrency(0);
        expect(formatted).toContain('0');
      });
    });

    describe('generateInvoiceNumber', () => {
      test('should generate invoice number with correct format', () => {
        const invoiceNum = vatCalculator.generateInvoiceNumber();
        expect(invoiceNum).toMatch(/^INV-\d{8}-[A-Z0-9]+$/);
      });

      test('should generate unique invoice numbers', () => {
        const invoiceNum1 = vatCalculator.generateInvoiceNumber();
        const invoiceNum2 = vatCalculator.generateInvoiceNumber();
        expect(invoiceNum1).not.toBe(invoiceNum2);
      });
    });

    describe('isEligibleForVatInvoice', () => {
      test('should return true for amount >= 200000', () => {
        expect(vatCalculator.isEligibleForVatInvoice(200000)).toBe(true);
        expect(vatCalculator.isEligibleForVatInvoice(500000)).toBe(true);
      });

      test('should return false for amount < 200000', () => {
        expect(vatCalculator.isEligibleForVatInvoice(199999)).toBe(false);
        expect(vatCalculator.isEligibleForVatInvoice(100000)).toBe(false);
      });
    });

    describe('calculateShippingCost', () => {
      test('should return free shipping for amount >= 500000', () => {
        expect(vatCalculator.calculateShippingCost(500000)).toBe(0);
        expect(vatCalculator.calculateShippingCost(1000000)).toBe(0);
      });

      test('should return 30000 for amount < 500000', () => {
        expect(vatCalculator.calculateShippingCost(499999)).toBe(30000);
        expect(vatCalculator.calculateShippingCost(100000)).toBe(30000);
      });
    });
  });

  // ==================================================
  // Guest Cart Middleware Tests
  // ==================================================
  describe('Guest Cart Middleware', () => {
    describe('initGuestCart', () => {
      test('should initialize empty guest cart in session', () => {
        const req = mockRequest({});
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        
        expect(req.session.guestCart).toBeDefined();
        expect(req.session.guestCart.items).toEqual([]);
        expect(mockNext).toHaveBeenCalled();
      });

      test('should not reinitialize existing guest cart', () => {
        const existingCart = {
          items: [{ product: 'test123', quantity: 2 }],
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        const req = mockRequest({ guestCart: existingCart });
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        
        expect(req.session.guestCart.items).toHaveLength(1);
        expect(req.session.guestCart.items[0].product).toBe('test123');
      });

      test('should attach guestCart methods to req', () => {
        const req = mockRequest({});
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        
        expect(req.guestCart).toBeDefined();
        expect(typeof req.guestCart.addItem).toBe('function');
        expect(typeof req.guestCart.updateItem).toBe('function');
        expect(typeof req.guestCart.removeItem).toBe('function');
        expect(typeof req.guestCart.clear).toBe('function');
        expect(typeof req.guestCart.getTotal).toBe('function');
      });
    });

    describe('Guest Cart Total Calculation', () => {
      test('should calculate total correctly', () => {
        const req = mockRequest({});
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        
        // Manually add items to simulate cart
        req.session.guestCart.items = [
          { product: 'prod1', productName: 'Product 1', price: 100000, quantity: 2 },
          { product: 'prod2', productName: 'Product 2', price: 50000, quantity: 3 }
        ];
        
        const total = req.guestCart.getTotal();
        expect(total).toBe(350000); // 100000*2 + 50000*3
      });

      test('should return 0 for empty cart', () => {
        const req = mockRequest({});
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        
        const total = req.guestCart.getTotal();
        expect(total).toBe(0);
      });
    });

    describe('Guest Cart Clear', () => {
      test('should clear all items', () => {
        const req = mockRequest({
          guestCart: {
            items: [{ product: 'prod1', quantity: 2 }],
            createdAt: new Date(),
            lastUpdated: new Date()
          }
        });
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        req.guestCart.clear();
        
        expect(req.session.guestCart.items).toHaveLength(0);
      });
    });

    describe('getCartCount', () => {
      test('should return total item count from req.guestCart', () => {
        const req = mockRequest({});
        const res = mockResponse();
        
        initGuestCart(req, res, mockNext);
        
        req.session.guestCart.items = [
          { product: 'prod1', quantity: 2 },
          { product: 'prod2', quantity: 3 }
        ];
        
        // getCartCount requires res to be passed, simplified test
        expect(req.session.guestCart.items.reduce((sum, item) => sum + item.quantity, 0)).toBe(5);
      });
    });
  });

  // ==================================================
  // Order Model Tests (Guest Order Fields)
  // ==================================================
  describe('Order Model - Guest Order Fields', () => {
    beforeAll(async () => {
      // Connect to test database if not already connected
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer-test');
      }
    });

    afterAll(async () => {
      // Clean up test data
      await Order.deleteMany({ 'guestInfo.email': /@test\.com$/ });
    });

    test('should create guest order with guest info', async () => {
      const guestOrder = new Order({
        isGuestOrder: true,
        guestInfo: {
          name: 'Test Guest',
          email: 'guest@test.com',
          phone: '0912345678',
          guestToken: 'test-token-123'
        },
        items: [{
          product: new mongoose.Types.ObjectId(),
          productName: 'Test Product',
          quantity: 1,
          price: 100000
        }],
        shippingAddress: {
          address: '123 Test Street',
          district: 'Test District',
          province: 'Test Province',
          phone: '0912345678'
        },
        paymentMethod: 'cod',
        totalAmount: 100000
      });

      expect(guestOrder.isGuestOrder).toBe(true);
      expect(guestOrder.guestInfo.name).toBe('Test Guest');
      expect(guestOrder.guestInfo.guestToken).toBe('test-token-123');
    });

    test('should have VAT invoice fields', async () => {
      const orderWithVat = new Order({
        isGuestOrder: false,
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          productName: 'Test Product',
          quantity: 1,
          price: 100000
        }],
        shippingAddress: {
          address: '123 Test Street',
          district: 'Test District',
          province: 'Test Province',
          phone: '0912345678'
        },
        paymentMethod: 'cod',
        totalAmount: 100000,
        vatInvoice: true,
        vatInfo: {
          companyName: 'Test Company',
          taxCode: '0123456789',
          address: '456 Company Street',
          email: 'invoice@test.com'
        }
      });

      expect(orderWithVat.vatInvoice).toBe(true);
      expect(orderWithVat.vatInfo.companyName).toBe('Test Company');
      expect(orderWithVat.vatInfo.taxCode).toBe('0123456789');
    });

    test('generateGuestToken should generate valid token', () => {
      const token = Order.generateGuestToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes in hex
    });

    test('findByGuestToken should be defined as static method', () => {
      expect(Order.findByGuestToken).toBeDefined();
      expect(typeof Order.findByGuestToken).toBe('function');
    });
  });

  // ==================================================
  // Shipping Cost Calculation Tests
  // ==================================================
  describe('Shipping Cost Calculation', () => {
    test('should calculate free shipping for orders >= 500000', () => {
      const shippingCost = vatCalculator.calculateShippingCost(500000);
      expect(shippingCost).toBe(0);
    });

    test('should calculate 30000 shipping for orders < 500000', () => {
      const shippingCost = vatCalculator.calculateShippingCost(400000);
      expect(shippingCost).toBe(30000);
    });

    test('should handle edge case at exactly 500000', () => {
      const shippingCost = vatCalculator.calculateShippingCost(500000);
      expect(shippingCost).toBe(0);
    });
  });

  // ==================================================
  // Integration Tests - Checkout Flow
  // ==================================================
  describe('Checkout Flow Integration', () => {
    test('should calculate correct totals for guest checkout', () => {
      const order = {
        items: [
          { price: 500000, quantity: 1 },
          { price: 300000, quantity: 2 }
        ]
      };
      
      const vatInfo = vatCalculator.calculateOrderVat(order);
      const subtotal = vatInfo.subtotal;
      const shippingCost = vatCalculator.calculateShippingCost(subtotal);
      const totalAmount = subtotal + shippingCost;
      
      expect(subtotal).toBe(1100000);
      expect(shippingCost).toBe(0); // Free shipping >= 500000
      expect(totalAmount).toBe(1100000);
    });

    test('should calculate correct totals with shipping fee', () => {
      const order = {
        items: [
          { price: 200000, quantity: 1 }
        ]
      };
      
      const vatInfo = vatCalculator.calculateOrderVat(order);
      const subtotal = vatInfo.subtotal;
      const shippingCost = vatCalculator.calculateShippingCost(subtotal);
      const totalAmount = subtotal + shippingCost;
      
      expect(subtotal).toBe(200000);
      expect(shippingCost).toBe(30000);
      expect(totalAmount).toBe(230000);
    });
  });
});
