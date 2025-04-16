const Product = require('../../models/product');
const Category = require('../../models/category');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

// Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Xây dựng bộ lọc
    const filter = {};
    
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.brand) {
      filter.brand = req.query.brand;
    }

    if (req.query.stock === 'low') {
      filter.stock = { $lt: 10 };
    } else if (req.query.stock === 'out') {
      filter.stock = { $lt: 1 };
    }
    
    // Lấy danh sách sản phẩm
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số sản phẩm
    const total = await Product.countDocuments(filter);
    
    // Lấy danh sách danh mục và thương hiệu
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.render('admin/products/index', {
      title: 'Quản lý sản phẩm',
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      categories,
      brands,
      filter: req.query,
      path: '/admin/products'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách sản phẩm.');
    res.redirect('/admin');
  }
};

// Hiển thị form thêm sản phẩm mới
exports.getAddProduct = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.render('admin/products/add', {
      title: 'Thêm sản phẩm mới',
      categories,
      brands,
      path: '/admin/products'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang thêm sản phẩm.');
    res.redirect('/admin/products');
  }
};

// Xử lý thêm sản phẩm mới
exports.postAddProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      stock,
      specifications,
      variants,
      featured
    } = req.body;
    
    // Tạo slug từ tên sản phẩm
    const slug = name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    // Kiểm tra xem slug đã tồn tại chưa
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      req.flash('error', 'Sản phẩm với tên tương tự đã tồn tại.');
      return res.redirect('/admin/products/add');
    }
    
    // Xử lý hình ảnh đã tải lên
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(file.filename);
      });
    }
    
    // Xử lý thông số kỹ thuật
    const parsedSpecs = [];
    if (specifications) {
      const specNames = Array.isArray(specifications.name) ? specifications.name : [specifications.name];
      const specValues = Array.isArray(specifications.value) ? specifications.value : [specifications.value];
      
      for (let i = 0; i < specNames.length; i++) {
        if (specNames[i] && specValues[i]) {
          parsedSpecs.push({
            name: specNames[i],
            value: specValues[i]
          });
        }
      }
    }
    
    // Xử lý phiên bản sản phẩm
    const parsedVariants = [];
    if (variants) {
      const variantNames = Array.isArray(variants.name) ? variants.name : [variants.name];
      const variantValues = Array.isArray(variants.value) ? variants.value : [variants.value];
      const additionalPrices = Array.isArray(variants.additionalPrice) 
        ? variants.additionalPrice 
        : [variants.additionalPrice];
      const variantStocks = Array.isArray(variants.stock) ? variants.stock : [variants.stock];
      
      // Nhóm theo tên phiên bản
      const variantGroups = {};
      
      for (let i = 0; i < variantNames.length; i++) {
        if (variantNames[i] && variantValues[i]) {
          if (!variantGroups[variantNames[i]]) {
            variantGroups[variantNames[i]] = {
              name: variantNames[i],
              options: []
            };
          }
          
          variantGroups[variantNames[i]].options.push({
            value: variantValues[i],
            additionalPrice: additionalPrices[i] ? parseFloat(additionalPrices[i]) : 0,
            stock: variantStocks[i] ? parseInt(variantStocks[i]) : 0
          });
        }
      }
      
      Object.values(variantGroups).forEach(group => {
        parsedVariants.push(group);
      });
    }
    
    // Tạo sản phẩm mới
    const product = new Product({
      name,
      slug,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      category,
      subcategory,
      brand,
      stock: parseInt(stock),
      images,
      specifications: parsedSpecs,
      variants: parsedVariants,
      featured: featured === 'on'
    });
    
    await product.save();
    
    req.flash('success', 'Sản phẩm đã được thêm thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi thêm sản phẩm.');
    res.redirect('/admin/products/add');
  }
};

// Hiển thị form chỉnh sửa sản phẩm
exports.getEditProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }
    
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');
    
    res.render('admin/products/edit', {
      title: `Chỉnh sửa: ${product.name}`,
      product,
      categories,
      brands,
      path: '/admin/products'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thông tin sản phẩm.');
    res.redirect('/admin/products');
  }
};

// Xử lý cập nhật sản phẩm
exports.postUpdateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      stock,
      specifications,
      variants,
      removeImages,
      featured
    } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }
    
    // Xử lý hình ảnh mới tải lên
    const newImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        newImages.push(file.filename);
      });
    }
    
    // Xử lý hình ảnh hiện có (xóa hình ảnh đã chọn)
    const existingImages = [...product.images];
    if (removeImages) {
      const imagesToRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
      
      // Xóa tệp hình ảnh
      imagesToRemove.forEach(img => {
        const imagePath = path.join(__dirname, '../public/uploads/products', img);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
      
      // Lọc ra các hình ảnh đã bị xóa
      product.images = existingImages.filter(img => !imagesToRemove.includes(img));
    }
    
    // Thêm hình ảnh mới
    product.images = [...product.images, ...newImages];
    
    // Xử lý thông số kỹ thuật
    const parsedSpecs = [];
    if (specifications) {
      const specNames = Array.isArray(specifications.name) ? specifications.name : [specifications.name];
      const specValues = Array.isArray(specifications.value) ? specifications.value : [specifications.value];
      
      for (let i = 0; i < specNames.length; i++) {
        if (specNames[i] && specValues[i]) {
          parsedSpecs.push({
            name: specNames[i],
            value: specValues[i]
          });
        }
      }
    }
    
    // Xử lý phiên bản sản phẩm
    const parsedVariants = [];
    if (variants) {
      const variantNames = Array.isArray(variants.name) ? variants.name : [variants.name];
      const variantValues = Array.isArray(variants.value) ? variants.value : [variants.value];
      const additionalPrices = Array.isArray(variants.additionalPrice) 
        ? variants.additionalPrice 
        : [variants.additionalPrice];
      const variantStocks = Array.isArray(variants.stock) ? variants.stock : [variants.stock];
      
      // Nhóm theo tên phiên bản
      const variantGroups = {};
      
      for (let i = 0; i < variantNames.length; i++) {
        if (variantNames[i] && variantValues[i]) {
          if (!variantGroups[variantNames[i]]) {
            variantGroups[variantNames[i]] = {
              name: variantNames[i],
              options: []
            };
          }
          
          variantGroups[variantNames[i]].options.push({
            value: variantValues[i],
            additionalPrice: additionalPrices[i] ? parseFloat(additionalPrices[i]) : 0,
            stock: variantStocks[i] ? parseInt(variantStocks[i]) : 0
          });
        }
      }
      
      Object.values(variantGroups).forEach(group => {
        parsedVariants.push(group);
      });
    }
    
    // Cập nhật sản phẩm
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    product.category = category;
    product.subcategory = subcategory;
    product.brand = brand;
    product.stock = parseInt(stock);
    product.specifications = parsedSpecs;
    product.variants = parsedVariants;
    product.featured = featured === 'on';
    
    await product.save();
    
    req.flash('success', 'Sản phẩm đã được cập nhật thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật sản phẩm.');
    res.redirect(`/admin/products/edit/${req.params.productId}`);
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    
    // Xóa hình ảnh sản phẩm
    product.images.forEach(img => {
      const imagePath = path.join(__dirname, '../public/uploads/products', img);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });
    
    await Product.deleteOne({ _id: productId });
    
    return res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa thành công.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xóa sản phẩm.' });
  }
};

// Quản lý hàng tồn kho
exports.getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Xây dựng bộ lọc
    const filter = {};
    
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    if (req.query.stock === 'low') {
      filter.stock = { $lt: 10, $gt: 0 };
    } else if (req.query.stock === 'out') {
      filter.stock = { $lt: 1 };
    }
    
    // Lấy danh sách sản phẩm
    const products = await Product.find(filter)
      .select('name stock category brand images')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số sản phẩm
    const total = await Product.countDocuments(filter);
    
    // Lấy thống kê
    const outOfStockCount = await Product.countDocuments({ stock: { $lt: 1 } });
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
    
    res.render('admin/products/inventory', {
      title: 'Quản lý hàng tồn kho',
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      outOfStockCount,
      lowStockCount,
      filter: req.query,
      path: '/admin/products/inventory'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải trang quản lý hàng tồn kho.');
    res.redirect('/admin/products');
  }
};

// Cập nhật hàng tồn kho
exports.updateInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock, variantUpdates } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    
    // Cập nhật tồn kho chính
    if (stock !== undefined) {
      product.stock = parseInt(stock);
    }
    
    // Cập nhật tồn kho cho các phiên bản
    if (variantUpdates) {
      for (const update of variantUpdates) {
        const { variantName, variantValue, stock } = update;
        
        const variant = product.variants.find(v => v.name === variantName);
        if (variant) {
          const option = variant.options.find(o => o.value === variantValue);
          if (option) {
            option.stock = parseInt(stock);
          }
        }
      }
    }
    
    await product.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Đã cập nhật hàng tồn kho thành công.',
      newStock: product.stock
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật hàng tồn kho.' });
  }
};

// Quản lý danh mục sản phẩm
exports.getCategories = async (req, res) => {
  try {
    // Lấy danh sách danh mục
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          subcategories: { $addToSet: "$subcategory" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.render('admin/products/categories', {
      title: 'Quản lý danh mục',
      categories,
      path: '/admin/products/categories'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải danh sách danh mục.');
    res.redirect('/admin/products');
  }
};

// Các API export sản phẩm
exports.exportProducts = async (req, res) => {
  try {
    const products = await Product.find({}, {
      // Chỉ chọn các trường cần thiết
      _id: 1,
      name: 1, 
      slug: 1,
      price: 1,
      discountPrice: 1,
      category: 1,
      subcategory: 1,
      brand: 1,
      stock: 1,
      sold: 1
    });
    
    // Trả về dạng JSON cho client tải xuống
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.json');
    
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xuất sản phẩm.' });
  }
};

// Thống kê sản phẩm
exports.getProductStatistics = async (req, res) => {
  try {
    // Lấy thống kê theo danh mục
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          totalSold: { $sum: "$sold" }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);
    
    // Lấy thống kê theo thương hiệu
    const brandStats = await Product.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          totalSold: { $sum: "$sold" }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);
    
    // Top 10 sản phẩm bán chạy nhất
    const topProducts = await Product.find()
      .sort({ sold: -1 })
      .limit(10);
    
    res.render('admin/products/statistics', {
      title: 'Thống kê sản phẩm',
      categoryStats,
      brandStats,
      topProducts,
      path: '/admin/products/statistics'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi khi tải thống kê sản phẩm.');
    res.redirect('/admin/products');
  }
};

// Tìm kiếm sản phẩm nâng cao (API)
exports.searchProducts = async (req, res) => {
  try {
    const { query, category, brand, priceMin, priceMax, inStock } = req.query;
    
    // Xây dựng bộ lọc
    const filter = {};
    
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (brand) {
      filter.brand = brand;
    }
    
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = parseFloat(priceMin);
      if (priceMax) filter.price.$lte = parseFloat(priceMax);
    }
    
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }
    
    // Tìm kiếm sản phẩm
    const products = await Product.find(filter)
      .select('name slug price discountPrice category brand stock images')
      .limit(20);
    
    return res.status(200).json({ success: true, products });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm.' });
  }
};