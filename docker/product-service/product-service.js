const express = require('express');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const axios = require('axios');
const os = require('os');
const multer = require('multer');
const path = require('path');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 4001;

// Cấu hình middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cấu hình storage cho upload ảnh sản phẩm
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/products');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Khởi tạo kết nối Redis cho message broker và cache
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
});

(async () => {
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
  console.log('Connected to Redis');
})();

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Định nghĩa model Product (nếu chưa được import từ thư mục models)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  // ... các trường khác của product
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// Đăng ký service với Service Registry
const registerWithServiceRegistry = async () => {
  const serviceHost = os.hostname();
  const servicePort = PORT;
  const serviceName = process.env.SERVICE_NAME || 'product-service';
  const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
  const serviceRegistry = process.env.SERVICE_REGISTRY_URL || 'http://service-registry:4100';

  try {
    const response = await axios.post(`${serviceRegistry}/register`, {
      name: serviceName,
      version: serviceVersion,
      host: serviceHost,
      port: servicePort
    });
    console.log('Service registered:', response.data);
    
    // Re-register every 20 seconds to prevent expiration
    setInterval(async () => {
      try {
        await axios.post(`${serviceRegistry}/register`, {
          name: serviceName,
          version: serviceVersion,
          host: serviceHost,
          port: servicePort
        });
        console.log('Service registration renewed');
      } catch (error) {
        console.error('Error renewing service registration:', error.message);
      }
    }, 20000);
    
  } catch (error) {
    console.error('Error registering service:', error.message);
  }
};

// Verify token middleware - Lấy session từ Redis
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Lấy thông tin session từ Redis
    const session = await redisClient.get(`session:${token}`);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = JSON.parse(session);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

// API Endpoints
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    // Lấy query parameters cho filtering, pagination, và sorting
    const { category, minPrice, maxPrice, search, page = 1, limit = 12, sort } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    let sortObj = { createdAt: -1 }; // Default sort
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortObj = { price: 1 };
          break;
        case 'price-desc':
          sortObj = { price: -1 };
          break;
        case 'name-asc':
          sortObj = { name: 1 };
          break;
        case 'name-desc':
          sortObj = { name: -1 };
          break;
        case 'rating-desc':
          sortObj = { averageRating: -1 };
          break;
        case 'bestseller':
          sortObj = { sold: -1 };
          break;
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with caching
    const cacheKey = `products:${JSON.stringify({ filter, sortObj, skip, limit })}`;
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached products data');
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // If not in cache, fetch from database
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(filter);
    
    const result = {
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache the result for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product by slug or ID
app.get('/api/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Kiểm tra identifier có phải là ObjectId không
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    // Lấy sản phẩm từ cache nếu có
    const cacheKey = `product:${identifier}`;
    const cachedProduct = await redisClient.get(cacheKey);
    
    if (cachedProduct) {
      console.log('Returning cached product data');
      return res.status(200).json(JSON.parse(cachedProduct));
    }
    
    // Tìm sản phẩm trong database nếu không có trong cache
    let product;
    if (isObjectId) {
      product = await Product.findById(identifier);
    } else {
      product = await Product.findOne({ slug: identifier });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Cache kết quả trong 10 phút
    await redisClient.set(cacheKey, JSON.stringify(product), { EX: 600 });
    
    // Thêm lượt xem
    product.views += 1;
    await product.save();
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('product_events', JSON.stringify({
      type: 'product_viewed',
      productId: product._id.toString(),
      timestamp: new Date().toISOString()
    }));
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add product review
app.post('/api/products/:id/review', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Thêm review mới
    const newReview = {
      user: req.user.userId,
      rating: Number(rating),
      comment,
      date: new Date()
    };
    
    product.reviews.push(newReview);
    
    // Tính lại điểm trung bình
    product.averageRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
    
    await product.save();
    
    // Xóa cache liên quan
    await redisClient.del(`product:${id}`);
    await redisClient.del(`product:${product.slug}`);
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('product_events', JSON.stringify({
      type: 'product_reviewed',
      productId: product._id.toString(),
      userId: req.user.userId,
      rating,
      timestamp: new Date().toISOString()
    }));
    
    res.status(201).json({
      success: true,
      review: newReview
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin APIs - Create product
app.post('/api/products', verifyToken, isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      stock,
      brand,
      specifications,
      variants
    } = req.body;
    
    // Xử lý danh sách ảnh
    const images = req.files.map(file => file.filename);
    
    // Tạo slug từ tên sản phẩm
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Tạo sản phẩm mới
    const product = new Product({
      name,
      slug,
      price: Number(price),
      description,
      category,
      stock: Number(stock),
      brand,
      specifications: JSON.parse(specifications || '[]'),
      variants: JSON.parse(variants || '[]'),
      images,
      createdAt: new Date()
    });
    
    await product.save();
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('product_events', JSON.stringify({
      type: 'product_created',
      productId: product._id.toString(),
      name: product.name,
      timestamp: new Date().toISOString()
    }));
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin APIs - Update product
app.put('/api/products/:id', verifyToken, isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Nếu có ảnh mới được upload
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => file.filename);
    }
    
    // Cập nhật sản phẩm
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Xóa cache liên quan
    await redisClient.del(`product:${id}`);
    await redisClient.del(`product:${product.slug}`);
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('product_events', JSON.stringify({
      type: 'product_updated',
      productId: product._id.toString(),
      name: product.name,
      timestamp: new Date().toISOString()
    }));
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin APIs - Delete product
app.delete('/api/products/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await Product.deleteOne({ _id: id });
    
    // Xóa cache liên quan
    await redisClient.del(`product:${id}`);
    await redisClient.del(`product:${product.slug}`);
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('product_events', JSON.stringify({
      type: 'product_deleted',
      productId: id,
      name: product.name,
      timestamp: new Date().toISOString()
    }));
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Listen for messages from other services
const subscribeToChannels = async () => {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();
  
  // Subscribe to order_events channel
  await subscriber.subscribe('order_events', (message) => {
    const event = JSON.parse(message);
    console.log('Received order event:', event);
    
    // Xử lý event từ order service
    if (event.type === 'order_completed') {
      // Cập nhật stock cho các sản phẩm
      if (event.items && event.items.length > 0) {
        updateProductStock(event.items);
      }
    }
  });
  
  console.log('Subscribed to order_events channel');
};

// Helper function to update product stock
const updateProductStock = async (items) => {
  try {
    for (const item of items) {
      if (item.variant) {
        await Product.updateOne(
          { _id: item.product, 'variants.name': item.variant.name, 'variants.options.value': item.variant.value },
          { $inc: { 'variants.$[v].options.$[o].stock': -item.quantity } },
          { arrayFilters: [{ 'v.name': item.variant.name }, { 'o.value': item.variant.value }] }
        );
      } else {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: -item.quantity } }
        );
      }
      
      // Xóa cache của sản phẩm này để cập nhật số lượng mới
      await redisClient.del(`product:${item.product}`);
      
      console.log(`Updated stock for product ${item.product}, -${item.quantity} units`);
    }
  } catch (error) {
    console.error('Error updating product stock:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Product Service running on port ${PORT}`);
  
  // Đăng ký với Service Registry
  await registerWithServiceRegistry();
  
  // Subscribe to Redis channels
  subscribeToChannels();
});