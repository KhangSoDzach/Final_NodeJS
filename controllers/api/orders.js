const express = require('express');
const router = express.Router();
const Order = require('../../models/order');
const Cart = require('../../models/cart');
const ApiResponse = require('../../utils/apiResponse');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return ApiResponse.error(res, 'Vui lòng đăng nhập để thực hiện chức năng này', 401);
    }
    next();
};

// GET /api/orders - Get user's orders
router.get('/', requireAuth, async(req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { user: req.user._id };

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('items.product', 'name images slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter)
        ]);

        return ApiResponse.paginated(res, orders, {
            page,
            limit,
            total
        });

    } catch (error) {
        console.error('Get orders error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi tải danh sách đơn hàng', 500);
    }
});

// POST /api/orders - Create new order
router.post('/', requireAuth, async(req, res) => {
    try {
        const { shippingAddress, paymentMethod, note } = req.body;

        // Validation
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
            return ApiResponse.error(res, 'Thiếu thông tin giao hàng', 400);
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return ApiResponse.error(res, 'Giỏ hàng trống', 400);
        }

        // Check stock for all items
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                return ApiResponse.error(res, `Sản phẩm ${item.product.name} không đủ số lượng`, 400);
            }
        }

        // Calculate totals
        const items = cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.discountPrice || item.product.price
        }));

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vat = subtotal * 0.1; // 10% VAT
        const totalPrice = subtotal + vat;

        // Create order
        const order = new Order({
            user: req.user._id,
            items,
            totalPrice,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            note,
            status: 'processing'
        });

        await order.save();

        // Update product stock and sold count
        for (const item of cart.items) {
            item.product.stock -= item.quantity;
            item.product.sold = (item.product.sold || 0) + item.quantity;
            await item.product.save();
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        return ApiResponse.success(res, order, 'Đặt hàng thành công', 201);

    } catch (error) {
        console.error('Create order error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi đặt hàng', 500);
    }
});

// GET /api/orders/:id - Get order detail
router.get('/:id', requireAuth, async(req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        })
            .populate('items.product', 'name images slug price')
            .lean();

        if (!order) {
            return ApiResponse.error(res, 'Không tìm thấy đơn hàng', 404);
        }

        return ApiResponse.success(res, order);

    } catch (error) {
        console.error('Get order detail error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi tải chi tiết đơn hàng', 500);
    }
});

module.exports = router;
