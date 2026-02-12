/**
 * Compare Controller
 * Xử lý so sánh sản phẩm
 */

const Product = require('../models/product');

// Giới hạn số sản phẩm so sánh
const MAX_COMPARE_ITEMS = 4;

/**
 * Helper: Lấy compare list từ session
 */
const getCompareList = (req) => {
  if (!req.session.compareList) {
    req.session.compareList = {
      products: [],
      category: null
    };
  }
  return req.session.compareList;
};

/**
 * Xem trang so sánh sản phẩm
 */
exports.getComparePage = async (req, res) => {
  try {
    const compareList = getCompareList(req);
    
    if (compareList.products.length === 0) {
      return res.render('products/compare', {
        title: 'So sánh sản phẩm',
        products: [],
        specifications: [],
        category: null
      });
    }
    
    // Lấy thông tin chi tiết sản phẩm
    const products = await Product.find({
      _id: { $in: compareList.products }
    }).lean();
    
    // Tổng hợp tất cả specifications để tạo bảng so sánh
    const allSpecs = new Map();
    products.forEach(product => {
      if (product.specifications) {
        product.specifications.forEach(spec => {
          if (!allSpecs.has(spec.name)) {
            allSpecs.set(spec.name, []);
          }
        });
      }
    });
    
    // Điền giá trị specifications cho từng sản phẩm
    const specifications = Array.from(allSpecs.keys()).map(specName => {
      const values = products.map(product => {
        const spec = product.specifications?.find(s => s.name === specName);
        return spec ? spec.value : '-';
      });
      return { name: specName, values };
    });
    
    // Thêm các thông tin cơ bản vào bảng so sánh
    const basicInfo = [
      {
        name: 'Giá',
        values: products.map(p => {
          const price = p.discountPrice || p.price;
          return price.toLocaleString('vi-VN') + 'đ';
        }),
        isPrice: true
      },
      {
        name: 'Thương hiệu',
        values: products.map(p => p.brand || '-')
      },
      {
        name: 'Tình trạng',
        values: products.map(p => p.stock > 0 ? 'Còn hàng' : 'Hết hàng')
      },
      {
        name: 'Đánh giá',
        values: products.map(p => {
          if (!p.ratings || p.ratings.count === 0) return 'Chưa có đánh giá';
          return `${p.ratings.average.toFixed(1)} ⭐ (${p.ratings.count})`;
        })
      }
    ];
    
    res.render('products/compare', {
      title: 'So sánh sản phẩm',
      products,
      specifications: [...basicInfo, ...specifications],
      category: compareList.category
    });
  } catch (error) {
    console.error('Error getting compare page:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải trang so sánh');
    res.redirect('/products');
  }
};

/**
 * Thêm sản phẩm vào danh sách so sánh (AJAX)
 */
exports.addToCompare = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm'
      });
    }
    
    const compareList = getCompareList(req);
    
    // Kiểm tra số lượng
    if (compareList.products.length >= MAX_COMPARE_ITEMS) {
      return res.status(400).json({
        success: false,
        message: `Chỉ được so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm`
      });
    }
    
    // Kiểm tra sản phẩm đã có chưa
    if (compareList.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có trong danh sách so sánh'
      });
    }
    
    // Lấy thông tin sản phẩm
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Kiểm tra category (chỉ so sánh cùng danh mục)
    if (compareList.products.length > 0 && compareList.category !== product.category) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể so sánh sản phẩm cùng danh mục. Vui lòng xóa danh sách hiện tại hoặc chọn sản phẩm cùng danh mục.'
      });
    }
    
    // Thêm sản phẩm
    compareList.products.push(productId);
    compareList.category = product.category;
    
    return res.json({
      success: true,
      message: 'Đã thêm vào danh sách so sánh',
      count: compareList.products.length,
      category: compareList.category
    });
  } catch (error) {
    console.error('Error adding to compare:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Xóa sản phẩm khỏi danh sách so sánh (AJAX)
 */
exports.removeFromCompare = async (req, res) => {
  try {
    const { productId } = req.params;
    const compareList = getCompareList(req);
    
    const index = compareList.products.indexOf(productId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không có trong danh sách so sánh'
      });
    }
    
    compareList.products.splice(index, 1);
    
    // Reset category nếu không còn sản phẩm
    if (compareList.products.length === 0) {
      compareList.category = null;
    }
    
    return res.json({
      success: true,
      message: 'Đã xóa khỏi danh sách so sánh',
      count: compareList.products.length
    });
  } catch (error) {
    console.error('Error removing from compare:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Xóa tất cả sản phẩm khỏi danh sách so sánh
 */
exports.clearCompare = async (req, res) => {
  try {
    req.session.compareList = {
      products: [],
      category: null
    };
    
    // Nếu là AJAX request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        message: 'Đã xóa danh sách so sánh'
      });
    }
    
    req.flash('success', 'Đã xóa danh sách so sánh');
    res.redirect('/compare');
  } catch (error) {
    console.error('Error clearing compare:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra'
      });
    }
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/compare');
  }
};

/**
 * Lấy danh sách so sánh (AJAX) - cho mini popup
 */
exports.getCompareList = async (req, res) => {
  try {
    const compareList = getCompareList(req);
    
    if (compareList.products.length === 0) {
      return res.json({
        products: [],
        count: 0,
        category: null
      });
    }
    
    const products = await Product.find({
      _id: { $in: compareList.products }
    }).select('name slug price discountPrice images').lean();
    
    return res.json({
      products,
      count: products.length,
      category: compareList.category
    });
  } catch (error) {
    console.error('Error getting compare list:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
};

/**
 * Kiểm tra sản phẩm có trong compare list không
 */
exports.checkInCompare = (req, res) => {
  try {
    const { productId } = req.params;
    const compareList = getCompareList(req);
    
    return res.json({
      inCompare: compareList.products.includes(productId),
      count: compareList.products.length
    });
  } catch (error) {
    console.error('Error checking compare:', error);
    return res.status(500).json({
      inCompare: false,
      count: 0
    });
  }
};
