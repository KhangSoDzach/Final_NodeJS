const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { createClient } = require('redis');
const axios = require('axios');
const os = require('os');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Cấu hình middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/sourcecomputer')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Đăng ký service với Service Registry
const registerWithServiceRegistry = async () => {
  const serviceHost = os.hostname();
  const servicePort = PORT;
  const serviceName = process.env.SERVICE_NAME || 'auth-service';
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

// Đăng ký route xử lý authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Tìm user trong database
    const User = mongoose.model('User');
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Tạo session token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Lưu session vào Redis
    await redisClient.set(`session:${token}`, JSON.stringify({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    }), { EX: 3600 }); // Expire sau 1 giờ
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('user_events', JSON.stringify({
      type: 'user_login',
      userId: user._id.toString(),
      timestamp: new Date().toISOString()
    }));
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Kiểm tra email đã tồn tại chưa
    const User = mongoose.model('User');
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Tạo user mới
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    await user.save();
    
    // Thông báo cho các service khác qua Redis pub/sub
    await redisClient.publish('user_events', JSON.stringify({
      type: 'user_registered',
      userId: user._id.toString(),
      timestamp: new Date().toISOString()
    }));
    
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token middleware
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

// Protected route example
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
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
  
  await subscriber.subscribe('order_events', (message) => {
    const event = JSON.parse(message);
    console.log('Received order event:', event);
    
    // Xử lý event từ order service
    if (event.type === 'order_completed') {
      // Cập nhật loyalty points cho user
      updateUserLoyaltyPoints(event.userId, event.pointsEarned);
    }
  });
  
  console.log('Subscribed to order_events channel');
};

// Helper function to update user loyalty points
const updateUserLoyaltyPoints = async (userId, points) => {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: points } });
    console.log(`Updated loyalty points for user ${userId}: +${points}`);
  } catch (error) {
    console.error('Error updating loyalty points:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Auth Service running on port ${PORT}`);
  
  // Đăng ký với Service Registry
  await registerWithServiceRegistry();
  
  // Subscribe to Redis channels
  subscribeToChannels();
});