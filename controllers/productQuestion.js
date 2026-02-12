/**
 * Product Question Controller
 * Xử lý hỏi đáp sản phẩm
 */

const ProductQuestion = require('../models/productQuestion');
const Product = require('../models/product');

/**
 * Lấy câu hỏi của sản phẩm (cho trang chi tiết sản phẩm)
 */
exports.getProductQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    
    const result = await ProductQuestion.getByProduct(productId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error getting product questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Đặt câu hỏi về sản phẩm
 */
exports.askQuestion = async (req, res) => {
  try {
    const { productId } = req.params;
    const { question, tags } = req.body;
    
    if (!question || question.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi phải có ít nhất 10 ký tự'
      });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Tạo câu hỏi mới
    const newQuestion = new ProductQuestion({
      product: productId,
      user: req.user._id,
      question: question.trim(),
      tags: tags || []
    });
    
    await newQuestion.save();
    
    // Populate user info để trả về
    await newQuestion.populate('user', 'name');
    
    return res.status(201).json({
      success: true,
      message: 'Câu hỏi đã được gửi và sẽ được trả lời sớm nhất',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error asking question:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Trả lời câu hỏi
 */
exports.answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Câu trả lời phải có ít nhất 5 ký tự'
      });
    }
    
    const question = await ProductQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }
    
    // Kiểm tra xem là admin hay user thường
    const isOfficial = req.user.role === 'admin';
    
    const answer = await question.addAnswer(
      req.user._id,
      content.trim(),
      isOfficial
    );
    
    // Populate user info
    await question.populate('answers.user', 'name role');
    
    return res.status(201).json({
      success: true,
      message: 'Câu trả lời đã được gửi',
      answer: question.answers[question.answers.length - 1]
    });
  } catch (error) {
    console.error('Error answering question:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Đánh dấu câu trả lời hữu ích
 */
exports.markHelpful = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    
    const question = await ProductQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }
    
    const result = await question.markAnswerHelpful(answerId, req.user._id);
    
    return res.json(result);
  } catch (error) {
    console.error('Error marking helpful:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * [ADMIN] Lấy danh sách câu hỏi chờ trả lời
 */
exports.getPendingQuestions = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const result = await ProductQuestion.getPendingQuestions({
      page: parseInt(page)
    });
    
    res.render('admin/questions/index', {
      title: 'Câu hỏi chờ trả lời',
      ...result
    });
  } catch (error) {
    console.error('Error getting pending questions:', error);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/admin/dashboard');
  }
};

/**
 * [ADMIN] Trả lời câu hỏi (render form)
 */
exports.getAnswerForm = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await ProductQuestion.findById(questionId)
      .populate('product', 'name slug images')
      .populate('user', 'name email')
      .populate('answers.user', 'name role');
    
    if (!question) {
      req.flash('error', 'Không tìm thấy câu hỏi');
      return res.redirect('/admin/questions');
    }
    
    res.render('admin/questions/answer', {
      title: 'Trả lời câu hỏi',
      question
    });
  } catch (error) {
    console.error('Error getting answer form:', error);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/admin/questions');
  }
};

/**
 * [ADMIN] Đóng câu hỏi
 */
exports.closeQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await ProductQuestion.findByIdAndUpdate(
      questionId,
      { status: 'closed' },
      { new: true }
    );
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }
    
    return res.json({
      success: true,
      message: 'Đã đóng câu hỏi'
    });
  } catch (error) {
    console.error('Error closing question:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Xóa câu hỏi (chỉ người đặt câu hỏi hoặc admin)
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await ProductQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }
    
    // Kiểm tra quyền xóa
    const isOwner = question.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa câu hỏi này'
      });
    }
    
    await ProductQuestion.findByIdAndDelete(questionId);
    
    return res.json({
      success: true,
      message: 'Đã xóa câu hỏi'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};
