const express = require('express');
const router = express.Router();
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const ApiResponse = require('../../utils/apiResponse');

// GET /api/cart - Get cart
router.get('/', async(req, res) => {
    try {
        let cart;

        if (req.isAuthenticated()) {
            // Authenticated user cart
            cart = await Cart.findOne({ user: req.user._id })
                .populate('items.product', 'name price discountPrice images slug stock');
        } else if (req.session.cartId) {
            // Guest cart by session
            cart = await Cart.findOne({ sessionId: req.session.cartId })
                .populate('items.product', 'name price discountPrice images slug stock');
        }

        if (!cart) {
            return ApiResponse.success(res, {
                items: [],
                total: 0,
                subtotal: 0,
                vat: 0
            });
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
            const price = item.product.discountPrice || item.product.price;
            return sum + (price * item.quantity);
        }, 0);

        const vat = subtotal * 0.1; // 10% VAT
        const total = subtotal + vat;

        return ApiResponse.success(res, {
            items: cart.items,
            subtotal,
            vat,
            total
        });

    } catch (error) {
        console.error('Get cart error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi tải giỏ hàng', 500);
    }
});

// POST /api/cart - Add item to cart
router.post('/', async(req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return ApiResponse.error(res, 'Thiếu thông tin sản phẩm', 400);
        }

        // Check product exists and has stock
        const product = await Product.findById(productId);
        if (!product) {
            return ApiResponse.error(res, 'Không tìm thấy sản phẩm', 404);
        }

        if (product.stock < quantity) {
            return ApiResponse.error(res, 'Sản phẩm không đủ số lượng', 400);
        }

        let cart;

        if (req.isAuthenticated()) {
            // Find or create user cart
            cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                cart = new Cart({ user: req.user._id, items: [] });
            }
        } else {
            // Find or create guest cart
            if (!req.session.cartId) {
                req.session.cartId = require('crypto').randomBytes(16).toString('hex');
            }

            cart = await Cart.findOne({ sessionId: req.session.cartId });
            if (!cart) {
                cart = new Cart({ sessionId: req.session.cartId, items: [] });
            }
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        await cart.populate('items.product', 'name price discountPrice images slug stock');

        return ApiResponse.success(res, cart, 'Đã thêm vào giỏ hàng', 201);

    } catch (error) {
        console.error('Add to cart error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi thêm vào giỏ hàng', 500);
    }
});

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', async(req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return ApiResponse.error(res, 'Số lượng không hợp lệ', 400);
        }

        let cart;

        if (req.isAuthenticated()) {
            cart = await Cart.findOne({ user: req.user._id });
        } else if (req.session.cartId) {
            cart = await Cart.findOne({ sessionId: req.session.cartId });
        }

        if (!cart) {
            return ApiResponse.error(res, 'Không tìm thấy giỏ hàng', 404);
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return ApiResponse.error(res, 'Không tìm thấy sản phẩm trong giỏ hàng', 404);
        }

        // Check stock
        const product = await Product.findById(item.product);
        if (product.stock < quantity) {
            return ApiResponse.error(res, 'Sản phẩm không đủ số lượng', 400);
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.product', 'name price discountPrice images slug stock');

        return ApiResponse.success(res, cart, 'Đã cập nhật giỏ hàng');

    } catch (error) {
        console.error('Update cart error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi cập nhật giỏ hàng', 500);
    }
});

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', async(req, res) => {
    try {
        const { itemId } = req.params;

        let cart;

        if (req.isAuthenticated()) {
            cart = await Cart.findOne({ user: req.user._id });
        } else if (req.session.cartId) {
            cart = await Cart.findOne({ sessionId: req.session.cartId });
        }

        if (!cart) {
            return ApiResponse.error(res, 'Không tìm thấy giỏ hàng', 404);
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();
        await cart.populate('items.product', 'name price discountPrice images slug stock');

        return ApiResponse.success(res, cart, 'Đã xóa sản phẩm khỏi giỏ hàng');

    } catch (error) {
        console.error('Remove from cart error:', error);
        return ApiResponse.error(res, 'Đã xảy ra lỗi khi xóa sản phẩm', 500);
    }
});

module.exports = router;
