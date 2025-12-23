/**
 * Product Question Routes
 * Routes cho hỏi đáp sản phẩm
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/productQuestion');
const { isAuth, isAdmin } = require('../middleware/auth');

// Public: Lấy câu hỏi của sản phẩm
router.get('/product/:productId', questionController.getProductQuestions);

// User: Đặt câu hỏi (yêu cầu đăng nhập)
router.post('/product/:productId/ask', isAuth, questionController.askQuestion);

// User: Trả lời câu hỏi (yêu cầu đăng nhập)
router.post('/:questionId/answer', isAuth, questionController.answerQuestion);

// User: Đánh dấu câu trả lời hữu ích
router.post('/:questionId/answer/:answerId/helpful', isAuth, questionController.markHelpful);

// User/Admin: Xóa câu hỏi
router.delete('/:questionId', isAuth, questionController.deleteQuestion);

// Admin: Đóng câu hỏi
router.post('/:questionId/close', isAuth, isAdmin, questionController.closeQuestion);

module.exports = router;
