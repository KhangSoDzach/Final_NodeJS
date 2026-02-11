const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Product = require('../../models/product');

const router = express.Router();

// Rate limiting middleware
const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many search requests, please try again later.'
});

// Input validation middleware
const validateSearch = [
    body('query')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Search query must be between 1 and 200 characters')
        .escape(),
    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Search endpoint
router.post('/', searchLimiter, validateSearch, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { query, limit = 10 } = req.body;
    const trimmedQuery = query.trim();
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(1, parsedLimit), 100)
        : 10;
    const searchRegex = new RegExp(escapeRegex(trimmedQuery), 'i');

    const filter = {
        $or: [
            { name: searchRegex },
            { brand: searchRegex },
            { category: searchRegex },
            { subcategory: searchRegex },
            { description: searchRegex },
            { sku: searchRegex }
        ]
    };

    try {
        const [products, total] = await Promise.all([
            Product.find(filter)
                .select('name slug category subcategory brand description price discountPrice images stock allowPreOrder ratings sold updatedAt')
                .sort({ sold: -1, updatedAt: -1 })
                .limit(safeLimit)
                .lean({ virtuals: true }),
            Product.countDocuments(filter)
        ]);

        const results = products.map(product => {
            const bestPrice = product.discountPrice && product.discountPrice > 0
                ? product.discountPrice
                : product.price;

            return {
                id: product._id,
                name: product.name,
                slug: product.slug,
                category: product.category,
                subcategory: product.subcategory,
                brand: product.brand,
                description: product.description,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                price: bestPrice,
                originalPrice: product.price,
                discountPrice: product.discountPrice,
                stock: product.stock,
                allowPreOrder: Boolean(product.allowPreOrder),
                rating: product.averageRating || 0,
                sold: product.sold || 0
            };
        });

        res.json({
            success: true,
            query: trimmedQuery,
            total,
            results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
