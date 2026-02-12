/**
 * Import products from JSON to MongoDB Atlas
 * Run: node import-products.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/product');

// Atlas connection
const ATLAS_URI = 'mongodb+srv://lexa61313_db_user:K1QIOtGjtMrwRwm9@sourcecomputer.dttg4ej.mongodb.net/sourcecomputer?retryWrites=true&w=majority&appName=SourceComputer';

async function importProducts() {
  try {
    const exportPath = path.join(__dirname, 'products-export.json');
    
    // Check if export file exists
    if (!fs.existsSync(exportPath)) {
      console.error('❌ products-export.json not found!');
      console.log('Please run "node export-products.js" first');
      process.exit(1);
    }

    console.log('📦 Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Read products from JSON
    const productsJson = fs.readFileSync(exportPath, 'utf8');
    const products = JSON.parse(productsJson);
    console.log(`📊 Found ${products.length} products in export file`);

    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({});
    // console.log('🗑️  Cleared existing products');

    // Insert products
    const inserted = await Product.insertMany(products, { ordered: false });
    console.log(`✅ Successfully imported ${inserted.length} products to Atlas!`);

    console.log('\n✨ Done! Products are now available on production.');
    console.log('Check: https://final-nodejs-njfq.onrender.com/products');

    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Some products already exist (duplicate slugs), skipping...');
      console.log('✅ Import completed with duplicates skipped');
      process.exit(0);
    } else {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }
}

importProducts();
