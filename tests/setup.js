/**
 * Jest Test Setup
 * Cấu hình môi trường test với MongoDB Memory Server
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Tăng timeout cho tests
jest.setTimeout(30000);

// Setup trước khi chạy tất cả tests
beforeAll(async () => {
  // Tạo MongoDB in-memory
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Kết nối Mongoose
  await mongoose.connect(mongoUri);

  // Register all models
  require('../models/user');
  require('../models/product');
  require('../models/order');
  require('../models/cart');
  require('../models/coupon');
  require('../models/backInStockNotification');
  require('../models/compareList');
  require('../models/preOrder');
  require('../models/productQuestion');
  require('../models/searchHistory');
  require('../models/stockMovement');
  require('../models/wishlist');
});


// Cleanup sau mỗi test
afterEach(async () => {
  // Xóa tất cả collections sau mỗi test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Đóng kết nối sau khi tất cả tests hoàn thành
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test helpers
global.testHelpers = {
  // Tạo mock request object
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    user: null,
    flash: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    ...overrides
  }),

  // Tạo mock response object
  createMockRes: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }
};
