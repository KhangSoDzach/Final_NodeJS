/**
 * Import route - Upload data-export.json to production
 * DELETE sau khi import xong!
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Coupon = require('../models/coupon');

// Import từ JSON data
router.post('/import-data', async (req, res) => {
  try {
    const { products, admins, coupons } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = {
      products: { imported: 0, skipped: 0 },
      admins: { imported: 0, skipped: 0 },
      coupons: { imported: 0, skipped: 0 }
    };

    // Import Products
    for (const product of products) {
      const exists = await Product.findOne({ slug: product.slug });
      if (!exists) {
        delete product._id;
        await Product.create(product);
        results.products.imported++;
      } else {
        results.products.skipped++;
      }
    }

    // Import Admins
    if (admins && Array.isArray(admins)) {
      for (const admin of admins) {
        const exists = await User.findOne({ email: admin.email });
        if (!exists) {
          delete admin._id;
          await User.create(admin);
          results.admins.imported++;
        } else {
          results.admins.skipped++;
        }
      }
    }

    // Import Coupons
    if (coupons && Array.isArray(coupons)) {
      for (const coupon of coupons) {
        const exists = await Coupon.findOne({ code: coupon.code });
        if (!exists) {
          delete coupon._id;
          await Coupon.create(coupon);
          results.coupons.imported++;
        } else {
          results.coupons.skipped++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Import completed!',
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
