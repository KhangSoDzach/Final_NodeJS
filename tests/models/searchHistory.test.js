/**
 * Unit Tests for SearchHistory Model
 * Tests for search history CRUD and static methods
 */

const mongoose = require('mongoose');
const SearchHistory = require('../../models/searchHistory');
const User = require('../../models/user');

describe('SearchHistory Model', () => {
  let testUser;

  beforeEach(async () => {
    await SearchHistory.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
  });

  describe('Schema Validation', () => {
    it('should create search history with valid data', async () => {
      const search = await SearchHistory.create({
        user: testUser._id,
        query: 'laptop dell',
        resultCount: 5,
        source: 'text'
      });

      expect(search._id).toBeDefined();
      expect(search.query).toBe('laptop dell');
      expect(search.normalizedQuery).toBe('laptop dell');
      expect(search.searchCount).toBe(1);
      expect(search.source).toBe('text');
    });

    it('should auto-generate normalizedQuery', async () => {
      const search = await SearchHistory.create({
        query: '  LAPTOP DELL  ',
        resultCount: 3
      });

      expect(search.normalizedQuery).toBe('laptop dell');
    });

    it('should require query field', async () => {
      await expect(SearchHistory.create({ resultCount: 5 }))
        .rejects.toThrow();
    });

    it('should accept null user (guest search)', async () => {
      const search = await SearchHistory.create({
        query: 'guest search',
        user: null
      });

      expect(search.user).toBeNull();
    });

    it('should validate source enum', async () => {
      const search = await SearchHistory.create({
        query: 'test',
        source: 'voice'
      });
      expect(search.source).toBe('voice');

      const search2 = await SearchHistory.create({
        query: 'test2',
        source: 'suggestion'
      });
      expect(search2.source).toBe('suggestion');
    });

    it('should store filters object', async () => {
      const filters = {
        category: 'laptop',
        brand: ['Dell', 'HP'],
        minPrice: 10000000,
        maxPrice: 50000000,
        rating: 4,
        inStock: true,
        hasDiscount: true
      };

      const search = await SearchHistory.create({
        query: 'laptop',
        filters
      });

      expect(search.filters.category).toBe('laptop');
      expect(search.filters.brand).toContain('Dell');
      expect(search.filters.minPrice).toBe(10000000);
    });

    it('should store clicked products', async () => {
      const search = await SearchHistory.create({
        query: 'laptop',
        clickedProducts: [{
          product: new mongoose.Types.ObjectId(),
          clickedAt: new Date()
        }]
      });

      expect(search.clickedProducts).toHaveLength(1);
    });
  });

  describe('Static Methods', () => {
    describe('getPopularSearches', () => {
      beforeEach(async () => {
        // Create sample search history
        await SearchHistory.insertMany([
          { query: 'laptop dell', normalizedQuery: 'laptop dell', searchCount: 10, resultCount: 5 },
          { query: 'laptop hp', normalizedQuery: 'laptop hp', searchCount: 8, resultCount: 3 },
          { query: 'monitor', normalizedQuery: 'monitor', searchCount: 15, resultCount: 2 },
          { query: 'single search', normalizedQuery: 'single search', searchCount: 1, resultCount: 1 }
        ]);
      });

      it('should return popular searches sorted by count', async () => {
        const popular = await SearchHistory.getPopularSearches(10);

        expect(popular.length).toBeGreaterThan(0);
        expect(popular[0].searchCount).toBeGreaterThanOrEqual(popular[1]?.searchCount || 0);
      });

      it('should respect limit parameter', async () => {
        const popular = await SearchHistory.getPopularSearches(2);

        expect(popular.length).toBeLessThanOrEqual(2);
      });

      it('should exclude searches with count less than 2', async () => {
        const popular = await SearchHistory.getPopularSearches(10);

        const singleSearch = popular.find(p => p.query === 'single search');
        expect(singleSearch).toBeUndefined();
      });
    });

    describe('getUserHistory', () => {
      beforeEach(async () => {
        await SearchHistory.insertMany([
          { user: testUser._id, query: 'search 1', normalizedQuery: 'search 1', lastSearchedAt: new Date('2024-01-01') },
          { user: testUser._id, query: 'search 2', normalizedQuery: 'search 2', lastSearchedAt: new Date('2024-01-02') },
          { user: testUser._id, query: 'search 3', normalizedQuery: 'search 3', lastSearchedAt: new Date('2024-01-03') },
          { user: null, query: 'guest search', normalizedQuery: 'guest search' }
        ]);
      });

      it('should return user search history', async () => {
        const history = await SearchHistory.getUserHistory(testUser._id);

        expect(history.length).toBe(3);
        expect(history.every(h => h.query)).toBe(true);
      });

      it('should sort by lastSearchedAt descending', async () => {
        const history = await SearchHistory.getUserHistory(testUser._id);

        expect(history[0].query).toBe('search 3');
        expect(history[2].query).toBe('search 1');
      });

      it('should respect limit parameter', async () => {
        const history = await SearchHistory.getUserHistory(testUser._id, 2);

        expect(history.length).toBe(2);
      });

      it('should not include other users history', async () => {
        const history = await SearchHistory.getUserHistory(testUser._id);

        const guestSearch = history.find(h => h.query === 'guest search');
        expect(guestSearch).toBeUndefined();
      });
    });

    describe('addOrUpdateSearch', () => {
      it('should create new search record', async () => {
        await SearchHistory.addOrUpdateSearch({
          user: testUser._id,
          query: 'new search',
          resultCount: 10,
          source: 'text'
        });

        const search = await SearchHistory.findOne({ normalizedQuery: 'new search' });
        expect(search).toBeTruthy();
        expect(search.searchCount).toBe(1);
      });

      it('should update existing search count', async () => {
        // First search
        await SearchHistory.addOrUpdateSearch({
          user: testUser._id,
          query: 'existing search',
          resultCount: 5
        });

        // Second search (same query)
        await SearchHistory.addOrUpdateSearch({
          user: testUser._id,
          query: 'existing search',
          resultCount: 8
        });

        const search = await SearchHistory.findOne({ 
          user: testUser._id, 
          normalizedQuery: 'existing search' 
        });
        expect(search.searchCount).toBe(2);
        expect(search.resultCount).toBe(8); // Updated to latest
      });

      it('should return null for empty query', async () => {
        const result = await SearchHistory.addOrUpdateSearch({
          query: '',
          resultCount: 0
        });

        expect(result).toBeNull();
      });

      it('should handle guest searches separately', async () => {
        await SearchHistory.addOrUpdateSearch({
          query: 'guest query',
          ipAddress: '192.168.1.1'
        });

        await SearchHistory.addOrUpdateSearch({
          user: testUser._id,
          query: 'guest query'
        });

        const searches = await SearchHistory.find({ normalizedQuery: 'guest query' });
        expect(searches.length).toBe(2);
      });
    });

    describe('clearUserHistory', () => {
      beforeEach(async () => {
        await SearchHistory.insertMany([
          { user: testUser._id, query: 'user search 1', normalizedQuery: 'user search 1' },
          { user: testUser._id, query: 'user search 2', normalizedQuery: 'user search 2' },
          { user: null, query: 'guest search', normalizedQuery: 'guest search' }
        ]);
      });

      it('should clear all user history', async () => {
        await SearchHistory.clearUserHistory(testUser._id);

        const remaining = await SearchHistory.find({ user: testUser._id });
        expect(remaining.length).toBe(0);
      });

      it('should not affect guest searches', async () => {
        await SearchHistory.clearUserHistory(testUser._id);

        const guestSearch = await SearchHistory.findOne({ user: null });
        expect(guestSearch).toBeTruthy();
      });
    });

    describe('removeSearch', () => {
      it('should remove specific search item', async () => {
        const search = await SearchHistory.create({
          user: testUser._id,
          query: 'to be removed',
          normalizedQuery: 'to be removed'
        });

        await SearchHistory.removeSearch(testUser._id, search._id);

        const removed = await SearchHistory.findById(search._id);
        expect(removed).toBeNull();
      });

      it('should not remove other users search', async () => {
        const otherUser = await User.create({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123'
        });

        const search = await SearchHistory.create({
          user: otherUser._id,
          query: 'other user search',
          normalizedQuery: 'other user search'
        });

        await SearchHistory.removeSearch(testUser._id, search._id);

        const stillExists = await SearchHistory.findById(search._id);
        expect(stillExists).toBeTruthy();
      });
    });

    describe('getSuggestions', () => {
      beforeEach(async () => {
        await SearchHistory.insertMany([
          { query: 'laptop dell xps', normalizedQuery: 'laptop dell xps', searchCount: 10, resultCount: 5 },
          { query: 'laptop dell inspiron', normalizedQuery: 'laptop dell inspiron', searchCount: 5, resultCount: 3 },
          { query: 'laptop hp', normalizedQuery: 'laptop hp', searchCount: 8, resultCount: 4 },
          { query: 'monitor lg', normalizedQuery: 'monitor lg', searchCount: 3, resultCount: 2 },
          { query: 'laptop no results', normalizedQuery: 'laptop no results', searchCount: 2, resultCount: 0 }
        ]);
      });

      it('should return suggestions starting with query', async () => {
        const suggestions = await SearchHistory.getSuggestions('laptop dell');

        expect(suggestions.length).toBe(2);
        expect(suggestions.every(s => s.query.toLowerCase().startsWith('laptop dell'))).toBe(true);
      });

      it('should sort by search count', async () => {
        const suggestions = await SearchHistory.getSuggestions('laptop');

        expect(suggestions[0].searchCount).toBeGreaterThanOrEqual(suggestions[1]?.searchCount || 0);
      });

      it('should respect limit', async () => {
        const suggestions = await SearchHistory.getSuggestions('laptop', null, 2);

        expect(suggestions.length).toBeLessThanOrEqual(2);
      });

      it('should exclude queries with no results', async () => {
        const suggestions = await SearchHistory.getSuggestions('laptop');

        const noResults = suggestions.find(s => s.query === 'laptop no results');
        expect(noResults).toBeUndefined();
      });

      it('should return empty for short query', async () => {
        const suggestions = await SearchHistory.getSuggestions('');

        expect(suggestions).toEqual([]);
      });
    });
  });

  describe('Indexes', () => {
    it('should have index defined in schema', async () => {
      // Verify index is defined in schema
      const schema = SearchHistory.schema;
      const indexes = schema.indexes();
      
      // Should have compound index { user: 1, normalizedQuery: 1 }
      const hasCompoundIndex = indexes.some(idx => {
        const [fields] = idx;
        return fields.user !== undefined && fields.normalizedQuery !== undefined;
      });
      
      expect(hasCompoundIndex).toBe(true);
    });
  });
});
