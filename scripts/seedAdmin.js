const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer';

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connection successful!');
  console.log(`Connected to: ${dbUri}`);
  seedAdmin();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Admin user function
async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@sourcecomputer.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      mongoose.connection.close();
      return;
    }
    
    // Admin password: admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create new admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@sourcecomputer.com',
      password: hashedPassword,
      role: 'admin',
      phone: '0987654321',
      addresses: [{
        street: '123 Admin Street',
        city: 'Hanoi',
        default: true
      }],
      loyaltyPoints: 100
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@sourcecomputer.com');
    console.log('Password: admin123');
    
    // Close the connection
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
