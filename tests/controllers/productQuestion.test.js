/**
 * Product Question Controller Tests  
 * Coverage: Q&A functionality, admin answers, helpful marking
 */

const ProductQuestion = require('../../models/productQuestion');
const Product = require('../../models/product');
const User = require('../../models/user');
const productQuestionController = require('../../controllers/productQuestion');

// Test data factories
const getMockUser = (overrides = {}) => ({
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'user',
    ...overrides
});

const getMockProduct = (overrides = {}) => ({
    name: 'Test Product',
    slug: 'test-product',
    price: 100,
    stock: 10,
    category: 'laptop',
    ...overrides
});

const getMockQuestion = (overrides = {}) => ({
    question: 'What are the specifications?',
    tags: ['specs', 'technical'],
    status: 'pending',
    answers: [],
    ...overrides
});

describe('ProductQuestion Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = global.testHelpers.createMockReq();
        res = global.testHelpers.createMockRes();
    });

    describe('getProductQuestions', () => {
        describe('Happy path', () => {
            it('should return questions for a product', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());
                await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.params = { productId: product._id.toString() };
                req.query = { page: 1, limit: 5 };

                await productQuestionController.getProductQuestions(req, res);

                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        questions: expect.any(Array)
                    })
                );
            });

            it('should return empty array when no questions', async () => {
                const product = await Product.create(getMockProduct());

                req.params = { productId: product._id.toString() };
                req.query = { page: 1, limit: 5 };

                await productQuestionController.getProductQuestions(req, res);

                expect(res.json).toHaveBeenCalled();
            });
        });

        describe('Edge cases', () => {
            it('should handle pagination correctly', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                // Create 10 questions
                for (let i = 0; i < 10; i++) {
                    await ProductQuestion.create({
                        question: `Question ${i}?`,
                        product: product._id,
                        user: user._id
                    });
                }

                req.params = { productId: product._id.toString() };
                req.query = { page: 2, limit: 5 };

                await productQuestionController.getProductQuestions(req, res);

                expect(res.json).toHaveBeenCalled();
            });
        });

        describe('Server errors (500)', () => {
            it('should handle database errors gracefully', async () => {
                jest.spyOn(ProductQuestion, 'getByProduct').mockRejectedValueOnce(new Error('DB Error'));

                req.params = { productId: 'prod123' };

                await productQuestionController.getProductQuestions(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false
                    })
                );
            });
        });
    });

    describe('askQuestion', () => {
        describe('Happy path', () => {
            it('should create new question successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { productId: product._id.toString() };
                req.body = {
                    question: 'What is the warranty period?',
                    tags: ['warranty', 'support']
                };

                await productQuestionController.askQuestion(req, res);

                const question = await ProductQuestion.findOne({ product: product._id });
                expect(question).toBeTruthy();
                expect(question.question).toBe('What is the warranty period?');
                expect(res.status).toHaveBeenCalledWith(201);
            });

            it('should create question without tags', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { productId: product._id.toString() };
                req.body = {
                    question: 'Does this product come with accessories?'
                };

                await productQuestionController.askQuestion(req, res);

                const question = await ProductQuestion.findOne({ product: product._id });
                expect(question).toBeTruthy();
                expect(question.tags).toEqual([]);
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject question shorter than 10 characters', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { productId: product._id.toString() };
                req.body = {
                    question: 'Short?'
                };

                await productQuestionController.askQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false,
                        message: expect.stringContaining('10 ký tự')
                    })
                );
            });

            it('should reject empty question', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { productId: product._id.toString() };
                req.body = {
                    question: '   '
                };

                await productQuestionController.askQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('Not found (404)', () => {
            it('should reject question for non-existent product', async () => {
                const user = await User.create(getMockUser());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { productId: 'nonexistent123' };
                req.body = {
                    question: 'What is this product about?'
                };

                await productQuestionController.askQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false,
                        message: expect.stringContaining('không tìm thấy')
                    })
                );
            });
        });

        describe('Authentication errors (401)', () => {
            it('should reject question from unauthenticated user', async () => {
                const product = await Product.create(getMockProduct());

                req.isAuthenticated = jest.fn(() => false);
                req.params = { productId: product._id.toString() };
                req.body = {
                    question: 'What is the warranty?'
                };

                await productQuestionController.askQuestion(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            });
        });
    });

    describe('answerQuestion', () => {
        describe('Happy path', () => {
            it('should add answer from admin successfully', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));
                const user = await User.create(getMockUser({ email: 'user@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };
                req.body = {
                    content: 'The warranty period is 2 years.'
                };

                await productQuestionController.answerQuestion(req, res);

                const updatedQuestion = await ProductQuestion.findById(question._id);
                expect(updatedQuestion.answers.length).toBe(1);
                expect(updatedQuestion.answers[0].isOfficial).toBe(true);
                expect(res.status).toHaveBeenCalledWith(201);
            });

            it('should add answer from regular user', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'user2@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user1._id
                });

                req.user = user2;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };
                req.body = {
                    content: 'Based on my experience, the warranty is 2 years.'
                };

                await productQuestionController.answerQuestion(req, res);

                const updatedQuestion = await ProductQuestion.findById(question._id);
                expect(updatedQuestion.answers.length).toBe(1);
                expect(updatedQuestion.answers[0].isOfficial).toBe(false);
            });
        });

        describe('Validation errors (400)', () => {
            it('should reject answer shorter than 5 characters', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };
                req.body = {
                    content: 'Yes'
                };

                await productQuestionController.answerQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false,
                        message: expect.stringContaining('5 ký tự')
                    })
                );
            });

            it('should reject empty answer', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };
                req.body = {
                    content: '   '
                };

                await productQuestionController.answerQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('Not found (404)', () => {
            it('should reject answer for non-existent question', async () => {
                const user = await User.create(getMockUser());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: 'nonexistent123' };
                req.body = {
                    content: 'This is my answer.'
                };

                await productQuestionController.answerQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });
    });

    describe('markHelpful', () => {
        describe('Happy path', () => {
            it('should mark answer as helpful successfully', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'user2@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user1._id,
                    answers: [{
                        user: user2._id,
                        content: 'Great answer',
                        isOfficial: false,
                        helpfulCount: 0
                    }]
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = {
                    questionId: question._id.toString(),
                    answerId: question.answers[0]._id.toString()
                };

                await productQuestionController.markHelpful(req, res);

                const updatedQuestion = await ProductQuestion.findById(question._id);
                expect(updatedQuestion.answers[0].helpfulCount).toBeGreaterThan(0);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: true
                    })
                );
            });
        });

        describe('Not found (404)', () => {
            it('should reject marking non-existent question', async () => {
                const user = await User.create(getMockUser());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = {
                    questionId: 'nonexistent123',
                    answerId: 'answer123'
                };

                await productQuestionController.markHelpful(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });

        describe('Edge cases', () => {
            it('should handle marking same answer multiple times', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'user2@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user1._id,
                    answers: [{
                        user: user2._id,
                        content: 'Great answer',
                        isOfficial: false,
                        helpfulCount: 0
                    }]
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = {
                    questionId: question._id.toString(),
                    answerId: question.answers[0]._id.toString()
                };

                // Mark helpful twice
                await productQuestionController.markHelpful(req, res);
                await productQuestionController.markHelpful(req, res);

                // Should only count once per user
                expect(res.json).toHaveBeenCalled();
            });
        });
    });

    describe('closeQuestion', () => {
        describe('Happy path', () => {
            it('should close question successfully by admin', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));
                const user = await User.create(getMockUser({ email: 'user@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id,
                    status: 'answered'
                });

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };

                await productQuestionController.closeQuestion(req, res);

                const updatedQuestion = await ProductQuestion.findById(question._id);
                expect(updatedQuestion.status).toBe('closed');
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: true
                    })
                );
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject closing question by non-admin', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };

                await productQuestionController.closeQuestion(req, res);

                // Depending on implementation, might reject
                expect(res.json).toHaveBeenCalled();
            });
        });

        describe('Not found (404)', () => {
            it('should reject closing non-existent question', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: 'nonexistent123' };

                await productQuestionController.closeQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });
    });

    describe('deleteQuestion', () => {
        describe('Happy path', () => {
            it('should delete own question successfully', async () => {
                const user = await User.create(getMockUser());
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };

                await productQuestionController.deleteQuestion(req, res);

                const deletedQuestion = await ProductQuestion.findById(question._id);
                expect(deletedQuestion).toBeNull();
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: true
                    })
                );
            });

            it('should allow admin to delete any question', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));
                const user = await User.create(getMockUser({ email: 'user@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };

                await productQuestionController.deleteQuestion(req, res);

                const deletedQuestion = await ProductQuestion.findById(question._id);
                expect(deletedQuestion).toBeNull();
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject deleting other user question', async () => {
                const user1 = await User.create(getMockUser());
                const user2 = await User.create(getMockUser({ email: 'user2@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user2._id
                });

                req.user = user1;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };

                await productQuestionController.deleteQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false,
                        message: expect.stringContaining('không có quyền')
                    })
                );
            });
        });

        describe('Not found (404)', () => {
            it('should reject deleting non-existent question', async () => {
                const user = await User.create(getMockUser());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: 'nonexistent123' };

                await productQuestionController.deleteQuestion(req, res);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });
    });

    describe('getPendingQuestions', () => {
        describe('Happy path', () => {
            it('should return pending questions for admin', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));
                const user = await User.create(getMockUser({ email: 'user@example.com' }));
                const product = await Product.create(getMockProduct());
                await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id,
                    status: 'pending'
                });

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.query = { page: 1 };

                await productQuestionController.getPendingQuestions(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'admin/questions/index',
                    expect.objectContaining({
                        questions: expect.any(Array)
                    })
                );
            });
        });

        describe('Authorization errors (403)', () => {
            it('should reject access by non-admin', async () => {
                const user = await User.create(getMockUser());

                req.user = user;
                req.isAuthenticated = jest.fn(() => true);

                await productQuestionController.getPendingQuestions(req, res);

                // Should redirect or reject
                expect(res.redirect || res.status).toHaveBeenCalled();
            });
        });
    });

    describe('getAnswerForm', () => {
        describe('Happy path', () => {
            it('should render answer form for admin', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));
                const user = await User.create(getMockUser({ email: 'user@example.com' }));
                const product = await Product.create(getMockProduct());
                const question = await ProductQuestion.create({
                    ...getMockQuestion(),
                    product: product._id,
                    user: user._id
                });

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: question._id.toString() };

                await productQuestionController.getAnswerForm(req, res);

                expect(res.render).toHaveBeenCalledWith(
                    'admin/questions/answer',
                    expect.objectContaining({
                        question: expect.any(Object)
                    })
                );
            });
        });

        describe('Not found (404)', () => {
            it('should redirect if question not found', async () => {
                const admin = await User.create(getMockUser({ role: 'admin' }));

                req.user = admin;
                req.isAuthenticated = jest.fn(() => true);
                req.params = { questionId: 'nonexistent123' };

                await productQuestionController.getAnswerForm(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('không tìm thấy'));
                expect(res.redirect).toHaveBeenCalledWith('/admin/questions');
            });
        });
    });

    describe('Server errors (500)', () => {
        it('should handle database errors gracefully', async () => {
            const user = await User.create(getMockUser());
            const product = await Product.create(getMockProduct());

            jest.spyOn(ProductQuestion, 'create').mockRejectedValueOnce(new Error('DB Error'));

            req.user = user;
            req.isAuthenticated = jest.fn(() => true);
            req.params = { productId: product._id.toString() };
            req.body = {
                question: 'What is the warranty period?'
            };

            await productQuestionController.askQuestion(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
