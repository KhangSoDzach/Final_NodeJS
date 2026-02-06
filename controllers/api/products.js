const express = require('express');
const router = express.Router();

// Mock data
let products = [
    { id: 1, name: 'Laptop', price: 999.99, stock: 5 },
    { id: 2, name: 'Mouse', price: 29.99, stock: 50 },
    { id: 3, name: 'Keyboard', price: 79.99, stock: 20 }
];
// GET all products
router.get('/', (req, res) => {
    res.json(products);
});

// GET product by ID
router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

// POST create product
router.post('/', (req, res) => {
    const product = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock
    };
    products.push(product);
    res.status(201).json(product);
});

// PUT update product
router.put('/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
    
    res.json(product);
});

// DELETE product
router.delete('/:id', (req, res) => {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Product not found' });
    
    const deletedProduct = products.splice(index, 1);
    res.json(deletedProduct[0]);
});
router.patch('/:id/stock', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { stock } = req.body;
    if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Invalid stock value' });
    };
    product.stock = stock;
    res.json(product);
});
module.exports = router;