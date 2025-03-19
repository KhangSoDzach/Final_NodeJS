const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.get('/', async (req, res) => {
  try {
    // Get new products (newest first)
    const newProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(8);
    
    // Get best sellers (most sold first)
    const bestSellers = await Product.find()
      .sort({ sold: -1 })
      .limit(8);
    
    // Get products by categories
    const categories = ['laptop', 'pc', 'monitor', 'component', 'accessory'];
    const categoryProducts = {};
    
    for (const category of categories) {
      categoryProducts[category] = await Product.find({ category })
        .sort({ createdAt: -1 })
        .limit(4);
    }
    
    res.render('home', {
      title: 'Home',
      newProducts,
      bestSellers,
      categories,
      categoryProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      error: 'An error occurred while loading the home page.'
    });
  }
});

// Static pages
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

router.get('/shipping-policy', (req, res) => {
  res.render('shipping-policy', { title: 'Shipping Policy' });
});

router.get('/return-policy', (req, res) => {
  res.render('return-policy', { title: 'Return Policy' });
});

router.get('/warranty-policy', (req, res) => {
  res.render('warranty-policy', { title: 'Warranty Policy' });
});

router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy', { title: 'Privacy Policy' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

module.exports = router;
