/**
 * ProductQuestion Model Tests
 * Tests cho model ProductQuestion sử dụng mock database
 */

const mongoose = require('mongoose');
const ProductQuestion = require('../../models/productQuestion');
const Product = require('../../models/product');
const User = require('../../models/user');

describe('ProductQuestion Model', () => {
  let testUser;
  let adminUser;
  let testProduct;

  beforeEach(async () => {
    // Clean up
    await ProductQuestion.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'Password123',
      phone: '0123456789',
      role: 'customer'
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Password123',
      phone: '0987654321',
      role: 'admin'
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Laptop',
      slug: 'test-laptop',
      description: 'A test laptop for testing',
      price: 15000000,
      category: 'Laptop',
      brand: 'Test Brand',
      stock: 10,
      sku: 'TEST-001'
    });
  });

  describe('Schema Validation', () => {
    it('should create a valid product question', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'Laptop này có hỗ trợ nâng cấp RAM không?'
      });

      expect(question).toBeDefined();
      expect(question.product.toString()).toBe(testProduct._id.toString());
      expect(question.user.toString()).toBe(testUser._id.toString());
      expect(question.status).toBe('pending');
    });

    it('should require product field', async () => {
      const question = new ProductQuestion({
        user: testUser._id,
        question: 'Test question?'
      });

      await expect(question.save()).rejects.toThrow();
    });

    it('should require user field', async () => {
      const question = new ProductQuestion({
        product: testProduct._id,
        question: 'Test question?'
      });

      await expect(question.save()).rejects.toThrow();
    });

    it('should require question field', async () => {
      const question = new ProductQuestion({
        product: testProduct._id,
        user: testUser._id
      });

      await expect(question.save()).rejects.toThrow();
    });

    it('should reject question shorter than 10 characters', async () => {
      const question = new ProductQuestion({
        product: testProduct._id,
        user: testUser._id,
        question: 'Short?'
      });

      await expect(question.save()).rejects.toThrow();
    });

    it('should accept question with 10+ characters', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'This is a valid question with enough characters?'
      });

      expect(question).toBeDefined();
    });

    it('should set default status to pending', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'What is the warranty period?'
      });

      expect(question.status).toBe('pending');
    });

    it('should initialize empty answers array', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'What is the warranty period?'
      });

      expect(question.answers).toEqual([]);
    });
  });

  describe('Instance Methods', () => {
    let question;

    beforeEach(async () => {
      question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'Does this laptop support RAM upgrade?'
      });
    });

    describe('addAnswer()', () => {
      it('should add an answer from regular user', async () => {
        const answer = await question.addAnswer(
          testUser._id,
          'Yes, it supports up to 32GB RAM.',
          false
        );

        expect(answer).toBeDefined();
        expect(question.answers).toHaveLength(1);
        expect(question.answers[0].content).toBe('Yes, it supports up to 32GB RAM.');
        expect(question.answers[0].isOfficial).toBe(false);
      });

      it('should add an official answer from admin', async () => {
        const answer = await question.addAnswer(
          adminUser._id,
          'This laptop supports RAM upgrade up to 64GB.',
          true
        );

        expect(question.answers[0].isOfficial).toBe(true);
        expect(question.status).toBe('answered');
      });

      it('should update status to answered when admin answers', async () => {
        await question.addAnswer(adminUser._id, 'Official answer here.', true);

        expect(question.status).toBe('answered');
      });

      it('should not change status when regular user answers', async () => {
        await question.addAnswer(testUser._id, 'User answer here.', false);

        expect(question.status).toBe('pending');
      });

      it('should allow multiple answers', async () => {
        await question.addAnswer(testUser._id, 'First answer', false);
        await question.addAnswer(adminUser._id, 'Second answer', true);
        await question.addAnswer(testUser._id, 'Third answer', false);

        expect(question.answers).toHaveLength(3);
      });
    });

    describe('markAnswerHelpful()', () => {
      beforeEach(async () => {
        await question.addAnswer(testUser._id, 'Helpful answer here.', false);
      });

      it('should mark answer as helpful', async () => {
        const answerId = question.answers[0]._id;
        const result = await question.markAnswerHelpful(answerId, adminUser._id);

        expect(result.success).toBe(true);
        expect(question.answers[0].helpfulCount).toBe(1);
        expect(question.answers[0].helpfulBy).toContainEqual(adminUser._id);
      });

      it('should toggle helpful mark (remove if already marked)', async () => {
        const answerId = question.answers[0]._id;
        await question.markAnswerHelpful(answerId, adminUser._id);
        const result = await question.markAnswerHelpful(answerId, adminUser._id);

        expect(result.success).toBe(true);
        expect(result.helpful).toBe(false); // Đã bỏ vote
        expect(question.answers[0].helpfulCount).toBe(0);
      });

      it('should allow multiple users to mark helpful', async () => {
        const answerId = question.answers[0]._id;
        await question.markAnswerHelpful(answerId, testUser._id);
        await question.markAnswerHelpful(answerId, adminUser._id);

        expect(question.answers[0].helpfulCount).toBe(2);
      });

      it('should handle non-existent answer ID', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const result = await question.markAnswerHelpful(fakeId, testUser._id);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Không tìm thấy câu trả lời');
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create multiple questions
      await ProductQuestion.create([
        {
          product: testProduct._id,
          user: testUser._id,
          question: 'Question 1 with enough characters?',
          status: 'pending'
        },
        {
          product: testProduct._id,
          user: testUser._id,
          question: 'Question 2 with enough characters?',
          status: 'answered'
        },
        {
          product: testProduct._id,
          user: testUser._id,
          question: 'Question 3 with enough characters?',
          status: 'pending'
        }
      ]);
    });

    describe('getByProduct()', () => {
      it('should get questions for a specific product', async () => {
        const result = await ProductQuestion.getByProduct(testProduct._id);

        expect(result.questions).toHaveLength(3);
        expect(result.pagination.total).toBe(3);
      });

      it('should paginate results correctly', async () => {
        const result = await ProductQuestion.getByProduct(testProduct._id, {
          page: 1,
          limit: 2
        });

        expect(result.questions).toHaveLength(2);
        expect(result.pagination.pages).toBe(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.total).toBe(3);
      });

      it('should return empty result for product with no questions', async () => {
        const newProduct = await Product.create({
          name: 'New Product',
          slug: 'new-product',
          description: 'No questions here',
          price: 1000000,
          category: 'PC',
          stock: 5,
          sku: 'NEW-001',
          brand: 'Test Brand'
        });

        const result = await ProductQuestion.getByProduct(newProduct._id);

        expect(result.questions).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.pages).toBe(0);
      });
    });

    describe('getPendingQuestions()', () => {
      it('should get only pending questions', async () => {
        const result = await ProductQuestion.getPendingQuestions();

        expect(result.questions).toHaveLength(2);
        result.questions.forEach(q => {
          expect(q.status).toBe('pending');
        });
      });

      it('should paginate pending questions', async () => {
        const result = await ProductQuestion.getPendingQuestions({ page: 1, limit: 1 });

        expect(result.questions).toHaveLength(1);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.pages).toBe(2);
      });
    });
  });

  describe('Virtuals', () => {
    it('should calculate answerCount correctly', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'Test question for answer count?'
      });

      await question.addAnswer(testUser._id, 'Answer 1', false);
      await question.addAnswer(adminUser._id, 'Answer 2', true);

      expect(question.answerCount).toBe(2);
    });

    it('should return 0 for question with no answers', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'Test question with no answers?'
      });

      expect(question.answerCount).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have index on product field', async () => {
      const indexes = await ProductQuestion.collection.indexes();
      const productIndex = indexes.find(idx => idx.key.product);
      
      expect(productIndex).toBeDefined();
    });

    it('should have index on status field', async () => {
      const indexes = await ProductQuestion.collection.indexes();
      const statusIndex = indexes.find(idx => idx.key.status);
      
      expect(statusIndex).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long question', async () => {
      const longQuestion = 'A'.repeat(500) + ' - đây là câu hỏi rất dài?';
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: longQuestion
      });

      expect(question.question).toBe(longQuestion);
    });

    it('should handle tags array', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'Question with tags for testing?',
        tags: ['RAM', 'upgrade', 'memory']
      });

      expect(question.tags).toHaveLength(3);
      expect(question.tags).toContain('RAM');
    });

    it('should handle empty tags array', async () => {
      const question = await ProductQuestion.create({
        product: testProduct._id,
        user: testUser._id,
        question: 'Question without any tags?',
        tags: []
      });

      expect(question.tags).toEqual([]);
    });
  });
});
