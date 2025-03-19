const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

// Function to seed admin user
async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@sourcecomputer.vn' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
      name: 'Admin',
      email: 'admin@sourcecomputer.vn',
      password: hashedPassword,
      role: 'admin',
      addresses: [{
        street: '123 Admin Street',
        city: 'Ho Chi Minh City',
        state: 'HCMC',
        zipCode: '70000',
        default: true
      }]
    });

    await admin.save();
    console.log('Admin user created successfully');
    
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
