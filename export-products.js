/**
 * Export products from local Docker MongoDB to JSON
 * Run: node export-products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/product');

// Force local MongoDB
const LOCAL_URI = 'mongodb://localhost:27017/sourcecomputer';

async function exportProducts() {
  try {
    console.log('📦 Connecting to local MongoDB...');
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Connected to local MongoDB');

    // Fetch all products
    const products = await Product.find({}).lean();
    console.log(`📊 Found ${products.length} products`);

    if (products.length === 0) {
      console.log('⚠️  No products found in local database');
      process.exit(0);
    }

    // Remove MongoDB _id and __v fields for clean import
    const cleanProducts = products.map(p => {
      const { _id, __v, createdAt, updatedAt, ...rest } = p;
      return rest;
    });

    // Save to JSON file
    const exportPath = path.join(__dirname, 'products-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(cleanProducts, null, 2));
    
    console.log(`✅ Exported ${cleanProducts.length} products to: ${exportPath}`);
    console.log('\nNext step: Run "node import-products.js" to import to Atlas');

    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportProducts();
