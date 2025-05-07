const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', '/usr/src/app/views');
app.use(express.static('/usr/src/app/public'));
app.use('/uploads', express.static('/usr/src/app/uploads'));

// Đường dẫn đến các service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:4001';

// Routes
app.get('/', (req, res) => {
  res.render('home', { 
    title: 'Trang chủ',
    user: null,
    products: [] 
  });
});

app.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Đăng nhập',
    user: null,
    error: null
  });
});

app.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Đăng ký',
    user: null,
    error: null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Không tìm thấy trang',
    user: null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Lỗi',
    user: null,
    error: err.message || 'Đã xảy ra lỗi'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend Service running on port ${PORT}`);
});