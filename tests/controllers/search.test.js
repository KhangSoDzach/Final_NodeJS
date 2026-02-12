/**
 * Unit Tests for Search Controller
 * Tests for autocomplete, search history, and filter options
 */

const mongoose = require('mongoose');
const SearchHistory = require('../../models/searchHistory');
const Product = require('../../models/product');
const User = require('../../models/user');
const searchController = require('../../controllers/search');

// Mock Express request/response
const mockRequest = (options = {}) => ({
  query: options.query || {},
  body: options.body || {},
  params: options.params || {},
  user: options.user || null,
  ip: options.ip || '127.0.0.1',
  get: jest.fn().mockReturnValue('Mozilla/5.0')
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Search Controller', () => {
  let testUser;
  let testProducts;

  beforeEach(async () => {
    await SearchHistory.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Create test products
    testProducts = await Product.insertMany([
      {
        name: 'Laptop Dell XPS 15',
        slug: 'laptop-dell-xps-15',
        description: 'High-end laptop with powerful specs',
        price: 35000000,
        discountPrice: 32000000,
        category: 'laptop',
        brand: 'Dell',
        stock: 10,
        images: ['dell-xps.jpg'],
        specifications: [
          { name: 'RAM', value: '16GB' },
          { name: 'CPU', value: 'Intel Core i7' }
        ],
        ratings: [{ user: testUser._id, rating: 5, review: 'Great!' }]
      },
      {
        name: 'Laptop HP Pavilion',
        slug: 'laptop-hp-pavilion',
        description: 'Budget-friendly laptop',
        price: 15000000,
        category: 'laptop',
        brand: 'HP',
        stock: 5,
        images: ['hp-pavilion.jpg'],
        specifications: [
          { name: 'RAM', value: '8GB' },
          { name: 'CPU', value: 'Intel Core i5' }
        ],
        ratings: [{ user: testUser._id, rating: 4, review: 'Good value' }]
      },
      {
        name: 'Monitor Samsung 27"',
        slug: 'monitor-samsung-27',
        description: '4K monitor for productivity',
        price: 8000000,
        category: 'monitor',
        brand: 'Samsung',
        stock: 0,
        allowPreOrder: true,
        images: ['samsung-monitor.jpg'],
        specifications: [
          { name: 'Kích thước màn hình', value: '27 inch' }
        ],
        ratings: []
      }
    ]);

    // Create some search history
    await SearchHistory.insertMany([
      { user: testUser._id, query: 'laptop dell', normalizedQuery: 'laptop dell', resultCount: 2, searchCount: 5 },
      { user: testUser._id, query: 'hp pavilion', normalizedQuery: 'hp pavilion', resultCount: 1, searchCount: 2 },
      { user: null, query: 'monitor samsung', normalizedQuery: 'monitor samsung', resultCount: 1, searchCount: 10 }
    ]);
  });

  describe('getSuggestions', () => {
    it('should return empty suggestions for short queries', async () => {
      const req = mockRequest({ query: { q: 'a' } });
      const res = mockResponse();

      await searchController.getSuggestions(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: []
      });
    });

    it('should return product suggestions for valid query', async () => {
      const req = mockRequest({ query: { q: 'laptop' } });
      const res = mockResponse();

      await searchController.getSuggestions(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.suggestions.products).toHaveLength(2);
      expect(response.suggestions.products[0].name).toContain('Laptop');
    });

    it('should return brand suggestions', async () => {
      const req = mockRequest({ query: { q: 'dell' } });
      const res = mockResponse();

      await searchController.getSuggestions(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.suggestions.brands).toContain('Dell');
    });

    it('should return category suggestions', async () => {
      const req = mockRequest({ query: { q: 'lap' } });
      const res = mockResponse();

      await searchController.getSuggestions(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.suggestions.categories).toContain('laptop');
    });
  });

  describe('getHistory', () => {
    it('should return empty history for non-logged-in users', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await searchController.getHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        history: []
      });
    });

    it('should return search history for logged-in users', async () => {
      const req = mockRequest({ user: testUser });
      const res = mockResponse();

      await searchController.getHistory(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.history).toHaveLength(2);
      expect(response.history[0].query).toBeDefined();
    });
  });

  describe('clearHistory', () => {
    it('should return error for non-logged-in users', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await searchController.clearHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chưa đăng nhập'
      });
    });

    it('should clear history for logged-in users', async () => {
      const req = mockRequest({ user: testUser });
      const res = mockResponse();

      await searchController.clearHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Đã xóa lịch sử tìm kiếm'
      });

      // Verify history is cleared
      const remaining = await SearchHistory.find({ user: testUser._id });
      expect(remaining).toHaveLength(0);
    });
  });

  describe('removeSearchItem', () => {
    it('should return error for non-logged-in users', async () => {
      const req = mockRequest({ params: { id: 'some-id' } });
      const res = mockResponse();

      await searchController.removeSearchItem(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should remove specific search item', async () => {
      const userHistory = await SearchHistory.findOne({ user: testUser._id });
      const req = mockRequest({ 
        user: testUser,
        params: { id: userHistory._id.toString() }
      });
      const res = mockResponse();

      await searchController.removeSearchItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Đã xóa'
      });
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular searches', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await searchController.getPopularSearches(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(Array.isArray(response.popular)).toBe(true);
    });
  });

  describe('trackSearch', () => {
    it('should return error for empty query', async () => {
      const req = mockRequest({ body: { query: '' } });
      const res = mockResponse();

      await searchController.trackSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should track search for logged-in users', async () => {
      const req = mockRequest({
        user: testUser,
        body: { query: 'new search term', resultCount: 5, source: 'text' }
      });
      const res = mockResponse();

      await searchController.trackSearch(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });

      // Verify search was saved
      const search = await SearchHistory.findOne({ 
        user: testUser._id, 
        normalizedQuery: 'new search term' 
      });
      expect(search).toBeTruthy();
      expect(search.resultCount).toBe(5);
    });

    it('should update existing search count', async () => {
      const req = mockRequest({
        user: testUser,
        body: { query: 'laptop dell', resultCount: 3 }
      });
      const res = mockResponse();

      await searchController.trackSearch(req, res);

      const search = await SearchHistory.findOne({ 
        user: testUser._id, 
        normalizedQuery: 'laptop dell' 
      });
      expect(search.searchCount).toBe(6); // Was 5, now 6
    });

    it('should track search for guest users', async () => {
      const req = mockRequest({
        body: { query: 'guest search', source: 'voice' }
      });
      const res = mockResponse();

      await searchController.trackSearch(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });

      const search = await SearchHistory.findOne({ normalizedQuery: 'guest search' });
      expect(search).toBeTruthy();
      expect(search.user).toBeNull();
      expect(search.source).toBe('voice');
    });
  });

  describe('getFilterOptions', () => {
    it('should return all filter options', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await searchController.getFilterOptions(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.filters.categories).toContain('laptop');
      expect(response.filters.categories).toContain('monitor');
      expect(response.filters.brands).toContain('Dell');
      expect(response.filters.brands).toContain('HP');
      expect(response.filters.priceRange).toHaveProperty('min');
      expect(response.filters.priceRange).toHaveProperty('max');
      expect(response.filters.ratings).toEqual([5, 4, 3, 2, 1]);
    });

    it('should filter options by category', async () => {
      const req = mockRequest({ query: { category: 'laptop' } });
      const res = mockResponse();

      await searchController.getFilterOptions(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.filters.brands).toContain('Dell');
      expect(response.filters.brands).toContain('HP');
      expect(response.filters.brands).not.toContain('Samsung');
    });

    it('should return spec filters', async () => {
      const req = mockRequest({ query: { category: 'laptop' } });
      const res = mockResponse();

      await searchController.getFilterOptions(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(Array.isArray(response.filters.specs)).toBe(true);
      
      const ramSpec = response.filters.specs.find(s => s.name === 'RAM');
      if (ramSpec) {
        expect(ramSpec.values).toContain('16GB');
        expect(ramSpec.values).toContain('8GB');
      }
    });
  });
});
