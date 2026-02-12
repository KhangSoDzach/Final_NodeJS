/**
 * Import products to MongoDB Atlas from JSON file
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const Product = require('./models/product');
const User = require('./models/user');
const Coupon = require('./models/coupon');

const ATLAS_URI = 'mongodb+srv://lexa61313_db_user:K1QIOtGjtMrwRwm9@sourcecomputer.dttg4ej.mongodb.net/sourcecomputer?retryWrites=true&w=majority&appName=SourceComputer';

async function importData() {
  try {
    // Read export file
    const filePath = path.join(__dirname, 'data-export.json');
    if (!fs.existsSync(filePath)) {
      console.error('❌ data-export.json not found. Run export-products-local.js first!');
      process.exit(1);
    }

    console.log('📖 Reading export file...');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found: ${data.products.length} products, ${data.admins.length} admins, ${data.coupons.length} coupons\n`);

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Import Products (skip if exists)
    console.log('📦 Importing products...');
    let productsImported = 0;
    let productsSkipped = 0;
    
    for (const product of data.products) {
      const exists = await Product.findOne({ slug: product.slug });
      if (!exists) {
        // Remove _id to let MongoDB generate new one
        delete product._id;
        await Product.create(product);
        productsImported++;
      } else {
        productsSkipped++;
      }
    }
    console.log(`  ✅ Imported: ${productsImported}`);
    console.log(`  ⏭️  Skipped (exists): ${productsSkipped}`);

    // Import Admins (skip if exists)
    console.log('\n👤 Importing admin users...');
    let adminsImported = 0;
    let adminsSkipped = 0;
    
    for (const admin of data.admins) {
      const exists = await User.findOne({ email: admin.email });
      if (!exists) {
        delete admin._id;
        await User.create(admin);
        adminsImported++;
      } else {
        adminsSkipped++;
      }
    }
    console.log(`  ✅ Imported: ${adminsImported}`);
    console.log(`  ⏭️  Skipped (exists): ${adminsSkipped}`);

    // Import Coupons (skip if exists)
    console.log('\n🎫 Importing coupons...');
    let couponsImported = 0;
    let couponsSkipped = 0;
    
    for (const coupon of data.coupons) {
      const exists = await Coupon.findOne({ code: coupon.code });
      if (!exists) {
        delete coupon._id;
        await Coupon.create(coupon);
        couponsImported++;
      } else {
        couponsSkipped++;
      }
    }
    console.log(`  ✅ Imported: ${couponsImported}`);
    console.log(`  ⏭️  Skipped (exists): ${couponsSkipped}`);

    await mongoose.disconnect();
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importData();
