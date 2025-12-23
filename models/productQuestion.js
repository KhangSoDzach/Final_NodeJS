/**
 * Product Question Model - Hỏi đáp sản phẩm
 * Cho phép khách hàng đặt câu hỏi về sản phẩm, admin/seller trả lời
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  isOfficial: {
    type: Boolean,
    default: false // True nếu admin/seller trả lời
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const productQuestionSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Câu hỏi phải có ít nhất 10 ký tự'],
    maxlength: 1000
  },
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['pending', 'answered', 'closed'],
    default: 'pending'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // Tags để phân loại câu hỏi
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
productQuestionSchema.index({ product: 1, createdAt: -1 });
productQuestionSchema.index({ user: 1 });
productQuestionSchema.index({ status: 1 });
productQuestionSchema.index({ question: 'text' });

// Virtual đếm số câu trả lời
productQuestionSchema.virtual('answerCount').get(function() {
  return this.answers.length;
});

// Virtual kiểm tra đã có câu trả lời chính thức chưa
productQuestionSchema.virtual('hasOfficialAnswer').get(function() {
  return this.answers.some(answer => answer.isOfficial);
});

// Method thêm câu trả lời
productQuestionSchema.methods.addAnswer = async function(userId, content, isOfficial = false) {
  this.answers.push({
    user: userId,
    content,
    isOfficial
  });
  
  // Update status nếu có câu trả lời chính thức
  if (isOfficial) {
    this.status = 'answered';
  }
  
  await this.save();
  return this.answers[this.answers.length - 1];
};

// Method đánh dấu câu trả lời hữu ích
productQuestionSchema.methods.markAnswerHelpful = async function(answerId, userId) {
  const answer = this.answers.id(answerId);
  
  if (!answer) {
    return { success: false, message: 'Không tìm thấy câu trả lời' };
  }
  
  // Kiểm tra đã vote chưa
  const hasVoted = answer.helpfulBy.some(id => id.toString() === userId.toString());
  
  if (hasVoted) {
    // Bỏ vote
    answer.helpfulBy = answer.helpfulBy.filter(id => id.toString() !== userId.toString());
    answer.helpfulCount = Math.max(0, answer.helpfulCount - 1);
  } else {
    // Thêm vote
    answer.helpfulBy.push(userId);
    answer.helpfulCount += 1;
  }
  
  await this.save();
  return { success: true, helpful: !hasVoted, count: answer.helpfulCount };
};

// Static method lấy câu hỏi của sản phẩm với phân trang
productQuestionSchema.statics.getByProduct = async function(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status = null,
    sort = '-createdAt'
  } = options;
  
  const query = { product: productId, isPublic: true };
  if (status) {
    query.status = status;
  }
  
  const questions = await this.find(query)
    .populate('user', 'name')
    .populate('answers.user', 'name role')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method lấy câu hỏi chờ trả lời (cho admin)
productQuestionSchema.statics.getPendingQuestions = async function(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  const questions = await this.find({ status: 'pending' })
    .populate('product', 'name slug images')
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments({ status: 'pending' });
  
  return {
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Đảm bảo virtuals được include
productQuestionSchema.set('toJSON', { virtuals: true });
productQuestionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);
