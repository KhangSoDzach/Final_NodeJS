const express = require('express');
const router = express.Router();
const Product = require('../../models/product');
const ApiResponse = require('../../utils/apiResponse');

// GET all products with filtering, sorting, and pagination
router.get('/', async(req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};

        // Search query
        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: 'i' };
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { brand: searchRegex }
            ];
        }

        // Category filter
        if (req.query.category) {
            filter.category = { $regex: new RegExp(`^${req.query.category}$`, 'i') };
        }

        // Brand filter
        if (req.query.brand) {
            filter.brand = { $regex: new RegExp(`^${req.query.brand}$`, 'i') };
        }

        // Price range
        if (req.query.minPrice || req.query.maxPrice) {
            const minPrice = parseInt(req.query.minPrice) || 0;
            const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

            filter.$expr = {
                $and: [
                    { $gte: [{ $ifNull: ['$discountPrice', '$price'] }, minPrice] },
                    { $lte: [{ $ifNull: ['$discountPrice', '$price'] }, maxPrice] }
                ]
            };
        }

        // Stock filter
        if (req.query.stock === 'in-stock') {
            filter.stock = { $gt: 0 };
        } else if (req.query.stock === 'out-of-stock') {
            filter.stock = { $lte: 0 };
        }

        // Sorting
        let sort = { createdAt: -1 }; // Default: newest first
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price-asc':
                    sort = { price: 1 };
                    break;
                case 'price-desc':
                    sort = { price: -1 };
                    break;
                case 'name-asc':
                    sort = { name: 1 };
                    break;
                case 'name-desc':
                    sort = { name: -1 };
                    break;
                case 'rating-desc':
                    sort = { averageRating: -1 };
                    break;
                case 'bestseller':
                case 'sold-desc':
                    sort = { sold: -1 };
                    break;
                case 'newest':
                case 'newest-desc':
                    sort = { createdAt: -1 };
                    break;
            }
        }

        // Execute query
        const [products, total] = await Promise.all([
            Product.find(filter)
                .select('name slug category brand price discountPrice images stock sold averageRating')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter)
        ]);

        // Return paginated response
        return ApiResponse.paginated(res, products, {
            page,
            limit,
            total
        });

    } catch (error) {
        console.error('Get products API error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi tải danh sách sản phẩm', 500);
    }
});

// GET single product by slug
router.get('/:slug', async(req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate({
                path: 'ratings.user',
                select: 'name'
            })
            .lean();

        if (!product) {
            return ApiResponse.error(res, 'Không tìm thấy sản phẩm', 404);
        }

        return ApiResponse.success(res, product);

    } catch (error) {
        console.error('Get product detail API error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi tải chi tiết sản phẩm', 500);
    }
});

module.exports = router;
