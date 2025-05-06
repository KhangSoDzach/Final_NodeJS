const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const helmet = require('helmet');
const compression = require('compression');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Đảm bảo các thư mục uploads tồn tại
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/products')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Thêm sau các khai báo require
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// WebSocket server for real-time features
const wss = new WebSocket.Server({ server });

// WebSocket handlers
wss.on('connection', function connection(ws, req) {
  console.log('WebSocket client connected');
  
  // Example of handling product review updates via WebSocket
  if (req.url.startsWith('/ws/reviews/')) {
    const productSlug = decodeURIComponent(req.url.split('/ws/reviews/')[1]);
    console.log(`Client subscribed to reviews for product: ${productSlug}`);
    
    // Store the product slug in the WebSocket object for later use
    ws.productSlug = productSlug;
  }
  
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  
  ws.on('close', function() {
    console.log('WebSocket client disconnected');
  });
});

// Function to broadcast review updates to subscribers
global.broadcastReview = (productSlug, review) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.productSlug === productSlug) {
      client.send(JSON.stringify({
        type: 'new_review',
        review: review
      }));
    }
  });
};

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/sourcecomputer')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Thêm dòng này để phục vụ thư mục uploads

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));
app.use(compression());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'e2f3c4d5e6f7a8b9c0d1e2f3c4d5e6f7a8b9c0d1e2f3',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://mongo:27017/sourcecomputer' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 ngày
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport
require('./config/passport')(passport);

// Flash messages
app.use(flash());

// Flash and User Middleware - setting up global variables for templates
app.use((req, res, next) => {
  // User authentication data
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.isAdmin = req.user && req.user.role === 'admin';
  res.locals.user = req.user || null;
  
  // Flash messages
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  
  // For debugging
  console.log('Session ID:', req.sessionID);
  console.log('Flash messages:', { 
    success: res.locals.success,
    error: res.locals.error
  });
  
  next();
});

// Cart middleware
app.use(async (req, res, next) => {
  try {
    const Cart = require('./models/cart');
    let cart;
    
    if (req.user) {
      // Logged-in user
      cart = await Cart.findOne({ user: req.user._id });
      
      // Transfer cart from session to user if exists
      if (!cart && req.session.cartId) {
        cart = await Cart.findOne({ sessionId: req.session.cartId });
        if (cart) {
          cart.user = req.user._id;
          cart.sessionId = null;
          await cart.save();
          delete req.session.cartId;
        }
      }
    } else if (req.session.cartId) {
      // Guest user with cart
      cart = await Cart.findOne({ sessionId: req.session.cartId });
    }
    
    if (cart) {
      await cart.populate('items.product');
      res.locals.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    } else {
      res.locals.cartCount = 0;
    }
    
    next();
  } catch (err) {
    console.error('Cart middleware error:', err);
    next();
  }
});

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const adminProductRoutes = require('./routes/admin/products');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/products', adminProductRoutes);

// Error handling
app.use((req, res, next) => {
  res.status(404).render('404', {
    title: 'Page Not Found'
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('error', {
    title: 'Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

module.exports = app;
