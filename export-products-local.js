/**
 * Export products from local MongoDB to JSON file
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const Product = require('./models/product');
const User = require('./models/user');
const Coupon = require('./models/coupon');

const LOCAL_URI = 'mongodb://localhost:27017/sourcecomputer';

async function exportData() {
  try {
    console.log('Connecting to local MongoDB...');
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Connected to local MongoDB\n');

    // Export Products
    console.log('📦 Exporting products...');
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products`);
    
    // Export Admin Users
    console.log('\n👤 Exporting admin users...');
    const admins = await User.find({ role: 'admin' }).lean();
    console.log(`Found ${admins.length} admin users`);
    
    // Export Coupons
    console.log('\n🎫 Exporting coupons...');
    const coupons = await Coupon.find({}).lean();
    console.log(`Found ${coupons.length} coupons`);

    // Save to file
    const exportData = {
      products,
      admins,
      coupons,
      exportedAt: new Date().toISOString()
    };

    const filePath = path.join(__dirname, 'data-export.json');
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n✅ Data exported to: ${filePath}`);
    console.log(`\nSummary:`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Admins: ${admins.length}`);
    console.log(`  - Coupons: ${coupons.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Export completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportData();
