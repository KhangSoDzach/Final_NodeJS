const fs = require('fs');
const path = require('path');
const Product = require('../../models/product');
const { validationResult } = require('express-validator');

// Mapping giữa tên danh mục tiếng Anh và tiếng Việt
const categoryMappings = {
  'laptop': 'laptop',
  'pc': 'pc',
  'monitor': 'màn hình',
  'component': 'linh kiện',
  'accessory': 'phụ kiện'
};

// Hàm helper để lấy danh sách tên danh mục tương đương (cả tiếng Anh và tiếng Việt)
function getEquivalentCategories(category) {
  // Tìm tên tiếng Việt nếu đầu vào là tiếng Anh
  const vietnameseName = categoryMappings[category];
  // Tìm tên tiếng Anh nếu đầu vào là tiếng Việt
  const englishName = Object.keys(categoryMappings).find(key => categoryMappings[key] === category);
  
  // Trả về tất cả các tên có thể cho danh mục
  const allNames = [category];
  
  if (vietnameseName && vietnameseName !== category) {
    allNames.push(vietnameseName);
  }
  
  if (englishName && englishName !== category) {
    allNames.push(englishName);
  }
  
  return allNames;
}

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
    
    // Hỗ trợ cả tên tiếng Anh và tiếng Việt cho danh mục
    if (req.query.category) {
      const equivalentCategories = getEquivalentCategories(req.query.category);
      const regexPattern = equivalentCategories.map(cat => `^${cat}$`).join('|');
      filter.category = { $regex: new RegExp(regexPattern, 'i') };
    }

    if (req.query.brand) {
      filter.brand = { $regex: new RegExp(`^${req.query.brand}$`, 'i') };
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
    
    // Chuyển đổi tên danh mục sang tiếng Việt cho hiển thị
    const displayCategories = categories.map(cat => {
      const vietnameseName = categoryMappings[cat.toLowerCase()];
      return vietnameseName || cat;
    });
    
    res.render('admin/products/index', {
      title: 'Quản lý sản phẩm',
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      categories: displayCategories,
      originalCategories: categories,
      brands,
      filter: req.query,
      path: '/admin/products',
      categoryMappings
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
    // Lấy danh mục từ database
    let categories = await Product.distinct('category');
    let brands = await Product.distinct('brand');
    
    // Thêm các danh mục mặc định nếu chưa có
    const defaultCategories = ['Laptop', 'PC', 'Màn hình', 'Linh kiện', 'Phụ kiện'];
    
    // Nếu không có danh mục trong database hoặc ít hơn danh sách mặc định
    if (!categories.length) {
      categories = defaultCategories;
    } else {
      // Thêm các danh mục mặc định nếu chưa có trong danh sách
      defaultCategories.forEach(category => {
        const equivalentCategories = getEquivalentCategories(category);
        // Kiểm tra xem có bất kỳ tên tương đương nào đã tồn tại trong danh sách categories
        const exists = categories.some(cat => 
          equivalentCategories.some(eqCat => 
            cat.toLowerCase() === eqCat.toLowerCase()
          )
        );
        
        if (!exists) {
          categories.push(category);
        }
      });
    }
    
    // Thêm các thương hiệu mặc định nếu chưa có
    const defaultBrands = ['Acer', 'Asus', 'Dell', 'HP', 'Lenovo', 'MSI', 'Apple', 'Samsung', 'LG', 'AMD', 'Intel', 'Gigabyte'];
    
    // Nếu không có thương hiệu trong database hoặc ít hơn danh sách mặc định
    if (!brands.length) {
      brands = defaultBrands;
    } else {
      // Thêm các thương hiệu mặc định nếu chưa có trong danh sách
      defaultBrands.forEach(brand => {
        if (!brands.includes(brand)) {
          brands.push(brand);
        }
      });
    }
    
    // Sắp xếp theo alphabet
    categories.sort();
    brands.sort();
    
    res.render('admin/products/add', {
      title: 'Thêm sản phẩm mới',
      categories,
      brands,
      path: '/admin/products',
      categoryMappings
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
        const { name, description, price, discountPrice, category, brand, stock, featured } = req.body;

        // Parse variants/options nếu có
        let variants = [];
        if (req.body['variantName'] && req.body['variantValue']) {
            // Hỗ trợ nhiều option
            const names = Array.isArray(req.body['variantName']) ? req.body['variantName'] : [req.body['variantName']];
            const values = Array.isArray(req.body['variantValue']) ? req.body['variantValue'] : [req.body['variantValue']];
            const additionalPrices = Array.isArray(req.body['variantAdditionalPrice']) ? req.body['variantAdditionalPrice'] : [req.body['variantAdditionalPrice']];
            const stocks = Array.isArray(req.body['variantStock']) ? req.body['variantStock'] : [req.body['variantStock']];
            // Gom nhóm theo tên option
            const variantMap = {};
            for (let i = 0; i < names.length; i++) {
                if (!variantMap[names[i]]) variantMap[names[i]] = [];
                variantMap[names[i]].push({
                    value: values[i],
                    additionalPrice: Number(additionalPrices[i]) || 0,
                    stock: Number(stocks[i]) || 0
                });
            }
            variants = Object.entries(variantMap).map(([name, options]) => ({
                name,
                options
            }));
        }

        // Tạo slug từ tên sản phẩm
        const slug = name
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');

        // Chỉ lưu tên file, không lưu toàn bộ đường dẫn
        const images = req.files && req.files.length > 0 
            ? req.files.map(file => file.filename) 
            : ['default-product.jpg'];  // Ảnh mặc định nếu không có ảnh nào được tải lên

        const product = new Product({
            name,
            slug,
            description,
            price: parseFloat(price),
            discountPrice: discountPrice ? parseFloat(discountPrice) : null,
            category,
            brand, 
            stock: parseInt(stock),
            images,
            featured: featured === 'on',
            variants // Thêm dòng này
        });

        await product.save();
        req.flash('success', 'Sản phẩm đã được thêm thành công.');
        res.redirect('/admin/products');
    } catch (error) {
        console.warn(error);
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
    
    // Lấy danh mục từ database
    let categories = await Product.distinct('category');
    let brands = await Product.distinct('brand');
    
    // Thêm các danh mục mặc định nếu chưa có
    const defaultCategories = ['Laptop', 'PC', 'Màn hình', 'Linh kiện', 'Phụ kiện'];
    
    // Nếu không có danh mục trong database hoặc ít hơn danh sách mặc định
    if (!categories.length) {
      categories = defaultCategories;
    } else {
      // Thêm các danh mục mặc định nếu chưa có trong danh sách
      defaultCategories.forEach(category => {
        const equivalentCategories = getEquivalentCategories(category);
        // Kiểm tra xem có bất kỳ tên tương đương nào đã tồn tại trong danh sách categories
        const exists = categories.some(cat => 
          equivalentCategories.some(eqCat => 
            cat.toLowerCase() === eqCat.toLowerCase()
          )
        );
        
        if (!exists) {
          categories.push(category);
        }
      });
    }
    
    // Thêm các thương hiệu mặc định nếu chưa có
    const defaultBrands = ['Acer', 'Asus', 'Dell', 'HP', 'Lenovo', 'MSI', 'Apple', 'Samsung', 'LG', 'AMD', 'Intel', 'Gigabyte'];
    
    // Nếu không có thương hiệu trong database hoặc ít hơn danh sách mặc định
    if (!brands.length) {
      brands = defaultBrands;
    } else {
      // Thêm các thương hiệu mặc định nếu chưa có trong danh sách
      defaultBrands.forEach(brand => {
        if (!brands.includes(brand)) {
          brands.push(brand);
        }
      });
    }
    
    // Đảm bảo danh mục và thương hiệu của sản phẩm hiện tại có trong danh sách
    if (product.category && !categories.includes(product.category)) {
      categories.push(product.category);
    }
    
    if (product.brand && !brands.includes(product.brand)) {
      brands.push(product.brand);
    }
    
    // Sắp xếp theo alphabet
    categories.sort();
    brands.sort();
    
    res.render('admin/products/edit', {
      title: `Chỉnh sửa: ${product.name}`,
      product,
      categories,
      brands,
      path: '/admin/products',
      categoryMappings
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
            brand,
            stock,
            removeImages,
            featured
        } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Không tìm thấy sản phẩm.');
            return res.redirect('/admin/products');
        }

        // Xử lý hình ảnh mới tải lên
        const newImages = req.files.map(file => file.filename);

        // Xử lý hình ảnh hiện có (xóa hình ảnh đã chọn)
        if (removeImages) {
            const imagesToRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
            imagesToRemove.forEach(img => {
                const imagePath = path.join(__dirname, '../../uploads/products', img);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
            product.images = product.images.filter(img => !imagesToRemove.includes(img));
        }

        // Thêm hình ảnh mới
        product.images = [...product.images, ...newImages];

        // Parse variants/options nếu có
        let variants = [];
        if (req.body['variantName'] && req.body['variantValue']) {
            const names = Array.isArray(req.body['variantName']) ? req.body['variantName'] : [req.body['variantName']];
            const values = Array.isArray(req.body['variantValue']) ? req.body['variantValue'] : [req.body['variantValue']];
            const additionalPrices = Array.isArray(req.body['variantAdditionalPrice']) ? req.body['variantAdditionalPrice'] : [req.body['variantAdditionalPrice']];
            const stocks = Array.isArray(req.body['variantStock']) ? req.body['variantStock'] : [req.body['variantStock']];
            const variantMap = {};
            for (let i = 0; i < names.length; i++) {
                if (!variantMap[names[i]]) variantMap[names[i]] = [];
                variantMap[names[i]].push({
                    value: values[i],
                    additionalPrice: Number(additionalPrices[i]) || 0,
                    stock: Number(stocks[i]) || 0
                });
            }
            variants = Object.entries(variantMap).map(([name, options]) => ({
                name,
                options
            }));
        }

        // Cập nhật các trường khác
        product.name = name;
        product.description = description;
        product.price = parseFloat(price);
        product.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
        product.category = category;
        product.brand = brand;
        product.stock = parseInt(stock);
        product.featured = featured === 'on';
        product.variants = variants; // Thêm dòng này

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

        // Tìm sản phẩm theo ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        }

        // Xóa hình ảnh sản phẩm
        if (product.images && product.images.length) {
            product.images.forEach(img => {
                const imagePath = path.join(__dirname, '../../public/uploads/products', img);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }

        // Xóa sản phẩm khỏi database
        await Product.deleteOne({ _id: productId });

        return res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa thành công.' });
    } catch (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xóa sản phẩm.' });
    }
};

// Quản lý hàng tồn kho
exports.getInventory = async (req, res) => {
    try {
        const products = await Product.find().select('name stock price');
        res.render('admin/products/inventory', {
            title: 'Quản lý tồn kho',
            products,
            path: '/admin/products/inventory'
        });
    } catch (err) {
        console.error("Error in getInventory:", err);
        req.flash('error', 'Không thể tải dữ liệu tồn kho');
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
    // Lấy danh sách các danh mục duy nhất
    const categories = await Product.distinct('category');
    
    // Tính số sản phẩm trong mỗi danh mục
    const categoriesWithDetails = await Promise.all(categories.map(async (categoryName) => {
      // Đếm số sản phẩm trong mỗi danh mục
      const productCount = await Product.countDocuments({ category: categoryName });
      
      // Lấy các danh mục con (subcategories)
      const subcategories = await Product.distinct('subcategory', { 
        category: categoryName,
        subcategory: { $exists: true, $ne: null, $ne: "" }
      });
      
      return {
        _id: categoryName,
        name: categoryName,
        count: productCount,
        subcategories: subcategories
      };
    }));
    
    res.render('admin/products/categories', {
      title: 'Quản lý danh mục',
      categories: categoriesWithDetails,
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
    
    // Hỗ trợ cả tên tiếng Anh và tiếng Việt cho danh mục
    if (category) {
      const equivalentCategories = getEquivalentCategories(category);
      const regexPattern = equivalentCategories.map(cat => `^${cat}$`).join('|');
      filter.category = { $regex: new RegExp(regexPattern, 'i') };
    }
    
    if (brand) {
      filter.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
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

// Thêm những function này vào cuối file

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    
    // Kiểm tra danh mục đã tồn tại chưa (không phân biệt chữ hoa/thường)
    const existingCategory = await Product.findOne({ 
      category: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Danh mục này đã tồn tại' });
    }
    
    // Tạo sản phẩm mẫu với danh mục mới
    const slug = `${name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')}-${Date.now()}`;
      
    const dummyProduct = new Product({
      name: `${name} Sample Product`,
      slug: slug,
      description: description || `Sản phẩm mẫu cho danh mục ${name}`,
      price: 0,
      category: name,
      brand: 'Sample Brand',
      stock: 0,
      images: ['default-product.jpg']
    });
    
    await dummyProduct.save();
    
    return res.status(201).json({ 
      success: true, 
      message: 'Đã thêm danh mục mới thành công',
      category: name
    });
  } catch (err) {
    console.error('Error creating category:', err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi thêm danh mục mới' });
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    
    // Kiểm tra danh mục mới đã tồn tại chưa (nếu đổi tên)
    if (categoryId !== name) {
      const existingCategory = await Product.findOne({ category: name });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Danh mục này đã tồn tại' });
      }
    }
    
    // Cập nhật tên danh mục cho tất cả sản phẩm
    await Product.updateMany(
      { category: categoryId }, 
      { $set: { category: name } }
    );
    
    return res.status(200).json({ 
      success: true, 
      message: 'Đã cập nhật danh mục thành công',
      category: name
    });
  } catch (err) {
    console.error('Error updating category:', err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật danh mục' });
  }
};

// Quản lý danh mục con
exports.manageSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { oldName, newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({ success: false, message: 'Tên danh mục con là bắt buộc' });
    }
    
    // Kiểm tra danh mục chính tồn tại không
    const categoryExists = await Product.findOne({ category: categoryId });
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục chính' });
    }
    
    if (oldName) {
      // Cập nhật tên danh mục con
      await Product.updateMany(
        { category: categoryId, subcategory: oldName },
        { $set: { subcategory: newName } }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: 'Đã cập nhật danh mục con thành công',
        subcategory: newName
      });
    } else {
      // Thêm danh mục con mới (tạo sản phẩm mẫu có danh mục con này)
      const dummyProduct = new Product({
        name: `${newName} Sample Product`,
        description: `Sample product for ${categoryId} - ${newName}`,
        price: 0,
        category: categoryId,
        subcategory: newName,
        brand: 'Sample Brand',
        stock: 0,
        images: ['default-product.jpg']
      });
      
      await dummyProduct.save();
      
      return res.status(201).json({ 
        success: true, 
        message: 'Đã thêm danh mục con mới thành công',
        subcategory: newName
      });
    }
  } catch (err) {
    console.error('Error managing subcategory:', err);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi quản lý danh mục con' });
  }
};