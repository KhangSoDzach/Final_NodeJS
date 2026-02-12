/**
 * Admin Seeder - Tạo tài khoản admin mặc định
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ email: 'admin@sourcecomputer.vn' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Tạo admin user
      const admin = new User({
        name: 'Admin',
        email: 'admin@sourcecomputer.vn',
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      
      await admin.save();
      console.log('Admin user created successfully!');
      console.log('Email: admin@sourcecomputer.vn');
      console.log('Password: admin123');
    }

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedAdmin();
