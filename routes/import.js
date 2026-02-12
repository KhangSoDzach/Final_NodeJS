/**
 * Import route - upload products JSON to production
 * DELETE sau khi import xong!
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const fs = require('fs');
const path = require('path');

// Import products from products-export.json
router.get('/import-products', async (req, res) => {
  try {
    const exportPath = path.join(__dirname, '../products-export.json');
    
    if (!fs.existsSync(exportPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'products-export.json not found. Please upload it to server.' 
      });
    }

    const productsJson = fs.readFileSync(exportPath, 'utf8');
    const products = JSON.parse(productsJson);
    
    // Insert products (skip duplicates)
    const results = {
      total: products.length,
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const product of products) {
      try {
        await Product.create(product);
        results.imported++;
      } catch (error) {
        if (error.code === 11000) {
          results.skipped++;
        } else {
          results.errors.push({ slug: product.slug, error: error.message });
        }
      }
    }

    res.json({
      success: true,
      message: 'Import completed',
      results,
      note: 'Remember to delete routes/import.js after import!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
