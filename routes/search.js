const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search');
const { setLocals } = require('../middleware/auth');

// Apply setLocals to all routes (để có req.user nếu đã đăng nhập)
router.use(setLocals);

/**
 * @route GET /search/suggestions
 * @desc Lấy gợi ý tìm kiếm (autocomplete)
 * @query q - Từ khóa tìm kiếm
 * @access Public
 */
router.get('/suggestions', searchController.getSuggestions);

/**
 * @route GET /search/history
 * @desc Lấy lịch sử tìm kiếm của user
 * @access Private (trả về [] nếu chưa đăng nhập)
 */
router.get('/history', searchController.getHistory);

/**
 * @route DELETE /search/history
 * @desc Xóa toàn bộ lịch sử tìm kiếm
 * @access Private
 */
router.delete('/history', searchController.clearHistory);

/**
 * @route DELETE /search/history/:id
 * @desc Xóa một item trong lịch sử tìm kiếm
 * @access Private
 */
router.delete('/history/:id', searchController.removeSearchItem);

/**
 * @route GET /search/popular
 * @desc Lấy các từ khóa tìm kiếm phổ biến
 * @access Public
 */
router.get('/popular', searchController.getPopularSearches);

/**
 * @route POST /search/track
 * @desc Ghi nhận một lượt tìm kiếm
 * @body query, resultCount, filters, source
 * @access Public
 */
router.post('/track', searchController.trackSearch);

/**
 * @route GET /search/filters
 * @desc Lấy tất cả options cho advanced filters
 * @query category - Lọc theo category (optional)
 * @access Public
 */
router.get('/filters', searchController.getFilterOptions);

module.exports = router;
