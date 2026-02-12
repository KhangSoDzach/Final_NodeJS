/**
 * Admin utility routes - ONLY for initial setup
 * DELETE sau khi seed xong!
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Product = require('../models/product');
const Coupon = require('../models/coupon');

// Middleware bảo vệPhục: chỉ cho phép trên production lần đầu
const allowSeedOnce = (req, res, next) => {
  // Kiểm tra xem đã có admin chưa
  User.findOne({ role: 'admin' })
    .then(admin => {
      if (admin) {
        return res.status(403).json({ 
          error: 'Seeding đã được thực hiện. Route này đã bị vô hiệu hóa.' 
        });
      }
      next();
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Route seed tất cả
router.get('/seed-database', allowSeedOnce, async (req, res) => {
  try {
    const results = {
      admin: null,
      products: null,
      coupons: null
    };

    // 1. Seed Admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@sourcecomputer.vn',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    results.admin = { email: admin.email };

    // 2. Seed Demo Products
    const products = [
      {
        name: 'Laptop Dell XPS 13',
        slug: 'laptop-dell-xps-13',
        description: 'Laptop cao cấp cho dân văn phòng, thiết kế mỏng nhẹ, màn hình InfinityEdge',
        price: 25000000,
        discountPrice: 23000000,
        category: 'laptop',
        subcategory: 'ultrabook',
        brand: 'Dell',
        stock: 10,
        images: ['dell-xps-13.jpg'],
        specifications: [
          { name: 'CPU', value: 'Intel Core i7-1165G7' },
          { name: 'RAM', value: '16GB LPDDR4x' },
          { name: 'Storage', value: '512GB NVMe SSD' },
          { name: 'Display', value: '13.4" FHD+ InfinityEdge' },
          { name: 'Graphics', value: 'Intel Iris Xe Graphics' }
        ]
      },
      {
        name: 'MacBook Pro 14"',
        slug: 'macbook-pro-14',
        description: 'Laptop Apple chip M3 Pro mạnh mẽ, màn hình Liquid Retina XDR',
        price: 52000000,
        category: 'laptop',
        brand: 'Apple',
        stock: 5,
        images: ['macbook-pro-14.jpg'],
        specifications: [
          { name: 'CPU', value: 'Apple M3 Pro 11-core' },
          { name: 'RAM', value: '18GB Unified Memory' },
          { name: 'Storage', value: '512GB SSD' },
          { name: 'Display', value: '14.2" Liquid Retina XDR' },
          { name: 'Graphics', value: '14-core GPU' }
        ]
      },
      {
        name: 'PC Gaming RTX 4070',
        slug: 'pc-gaming-rtx-4070',
        description: 'PC gaming mạnh mẽ với RTX 4070, chơi game 2K/4K mượt mà',
        price: 30000000,
        discountPrice: 28000000,
        category: 'pc',
        subcategory: 'gaming',
        brand: 'Custom Build',
        stock: 3,
        images: ['pc-gaming.jpg'],
        specifications: [
          { name: 'CPU', value: 'Intel Core i7-13700K' },
          { name: 'RAM', value: '32GB DDR5' },
          { name: 'Storage', value: '1TB NVMe SSD' },
          { name: 'Graphics', value: 'NVIDIA RTX 4070 12GB' },
          { name: 'PSU', value: '750W 80+ Gold' }
        ]
      }
    ];
    
    const createdProducts = await Product.insertMany(products);
    results.products = { count: createdProducts.length };

    // 3. Seed Coupons
    const coupons = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 5000000,
        maxDiscount: 1000000,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 100
      },
      {
        code: 'FREESHIP',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 1000000,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 200
      }
    ];
    
    const createdCoupons = await Coupon.insertMany(coupons);
    results.coupons = { count: createdCoupons.length };

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      results,
      credentials: {
        email: 'admin@sourcecomputer.vn',
        password: 'admin123'
      },
      warning: 'XÓA FILE routes/seed.js SAU KHI HOÀN TẤT!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
