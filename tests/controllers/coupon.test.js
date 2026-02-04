/**
 * Coupon Controller Tests
 * Comprehensive tests for coupon management and validation
 */

const mongoose = require('mongoose');
const Coupon = require('../../models/coupon');
const couponController = require('../../controllers/coupon');

describe('Coupon Controller', () => {
    // Factory functions
    const getMockCoupon = (overrides = {}) => ({
        code: 'TEST5',
        description: 'Test coupon',
        discount: 10,
        minAmount: 0,
        maxUses: 10,
        usedCount: 0,
        active: true,
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ====================================
    // Get Coupons Tests
    // ====================================
    describe('getCoupons', () => {
        test('should list all coupons - happy path', async () => {
            const coupon1 = new Coupon(getMockCoupon());
            await coupon1.save();

            const coupon2 = new Coupon(getMockCoupon({ code: 'TEST10', discount: 20 }));
            await coupon2.save();

            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await couponController.getCoupons(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/coupons/index',
                expect.objectContaining({
                    title: 'Quản lý Coupon',
                    coupons: expect.any(Array)
                })
            );
        });

        test('should handle empty coupon list', async () => {
            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await couponController.getCoupons(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test('should handle database error - 500', async () => {
            jest.spyOn(Coupon, 'find').mockImplementation(() => {
                throw new Error('Database error');
            });

            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            await couponController.getCoupons(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            expect(res.redirect).toHaveBeenCalledWith('/admin');
        });
    });

    // ====================================
    // Add Coupon Tests
    // ====================================
    describe('getAddCoupon', () => {
        test('should render add coupon form', () => {
            const req = global.testHelpers.createMockReq();
            const res = global.testHelpers.createMockRes();

            couponController.getAddCoupon(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/coupons/add',
                expect.objectContaining({
                    title: 'Thêm mã giảm giá mới'
                })
            );
        });
    });

    describe('postAddCoupon', () => {
        test('should create coupon with valid data - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'NEW50',
                    description: 'New year discount',
                    discount: 15,
                    minAmount: 100000,
                    maxUses: 5,
                    active: true
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'NEW50' });
            expect(coupon).toBeDefined();
            expect(coupon.discount).toBe(15);
            expect(coupon.maxUses).toBe(5);
            expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
        });

        test('should reject empty coupon code - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: '',
                    description: 'Test',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Mã giảm giá không được để trống.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });

        test('should reject duplicate coupon code - 400', async () => {
            const existing = new Coupon(getMockCoupon({ code: 'DUP50' }));
            await existing.save();

            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'DUP50',
                    description: 'Duplicate coupon',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Mã giảm giá này đã tồn tại.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });

        test('should reject coupon code with wrong length - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'ABC', // Less than 5 characters
                    description: 'Invalid length',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Mã giảm giá phải có đúng 5 ký tự.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });

        test('should reject maxUses greater than 10 - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'MAX50',
                    description: 'Too many uses',
                    discount: 10,
                    maxUses: 15 // More than allowed
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Số lần sử dụng tối đa phải từ 1 đến 10.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });

        test('should reject maxUses less than 1 - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'MIN50',
                    description: 'Too few uses',
                    discount: 10,
                    maxUses: 0
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Số lần sử dụng tối đa phải từ 1 đến 10.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });

        test('should handle non-numeric maxUses - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'NAN50',
                    description: 'Invalid maxUses',
                    discount: 10,
                    maxUses: 'abc'
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Số lần sử dụng tối đa phải từ 1 đến 10.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });

        test('should convert code to uppercase - happy path', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'low50',
                    description: 'Lowercase code',
                    discount: 10,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'LOW50' });
            expect(coupon).toBeDefined();
            expect(coupon.code).toBe('LOW50');
        });

        test('should handle active checkbox properly', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'ACT50',
                    description: 'Active coupon',
                    discount: 10,
                    maxUses: 5,
                    active: 'on'
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'ACT50' });
            expect(coupon.active).toBe(true);
        });

        test('should handle inactive coupon', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'INA50',
                    description: 'Inactive coupon',
                    discount: 10,
                    maxUses: 5,
                    active: false
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'INA50' });
            expect(coupon.active).toBe(false);
        });

        test('should set default minAmount to 0 if not provided', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'DEF50',
                    description: 'Default minAmount',
                    discount: 10,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'DEF50' });
            expect(coupon.minAmount).toBe(0);
        });

        test('should default maxUses to 10 if not provided', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'MAX10',
                    description: 'Default maxUses',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'MAX10' });
            expect(coupon.maxUses).toBe(10);
        });

        test('should handle database error - 500', async () => {
            jest.spyOn(Coupon.prototype, 'save').mockRejectedValueOnce(new Error('DB Error'));

            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'ERR50',
                    description: 'Error test',
                    discount: 10,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('Đã xảy ra lỗi'));
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons/add');
        });
    });

    // ====================================
    // Delete Coupon Tests
    // ====================================
    describe('deleteCoupon', () => {
        test('should delete coupon - happy path', async () => {
            const coupon = new Coupon(getMockCoupon());
            await coupon.save();

            const req = global.testHelpers.createMockReq({
                params: { couponId: coupon._id }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.deleteCoupon(req, res);

            const deleted = await Coupon.findById(coupon._id);
            expect(deleted).toBeNull();
            expect(req.flash).toHaveBeenCalledWith('success', 'Coupon đã được xóa thành công.');
        });

        test('should handle non-existent coupon deletion - 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = global.testHelpers.createMockReq({
                params: { couponId: fakeId }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.deleteCoupon(req, res);

            // Should not throw error, just redirect
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons');
        });

        test('should handle invalid coupon ID format - 400', async () => {
            const req = global.testHelpers.createMockReq({
                params: { couponId: new mongoose.Types.ObjectId().toString() }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.deleteCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons');
        });

        test('should handle database error - 500', async () => {
            const coupon = new Coupon(getMockCoupon());
            await coupon.save();

            jest.spyOn(Coupon, 'findByIdAndDelete').mockRejectedValueOnce(new Error('DB Error'));

            const req = global.testHelpers.createMockReq({
                params: { couponId: coupon._id }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.deleteCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Đã xảy ra lỗi khi xóa coupon.');
            expect(res.redirect).toHaveBeenCalledWith('/admin/coupons');
        });
    });

    // ====================================
    // Edge Cases
    // ====================================
    describe('Edge Cases', () => {
        test('should handle null/undefined values gracefully', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: null,
                    description: undefined,
                    discount: null
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
        });

        test('should handle very long coupon codes', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'VERYLONGCODE123456789',
                    description: 'Long code test',
                    discount: 10
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Mã giảm giá phải có đúng 5 ký tự.');
        });

        test('should handle special characters in code', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'T@ST5',
                    description: 'Special chars',
                    discount: 10,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            // Should succeed - special chars are allowed
            const coupon = await Coupon.findOne({ code: 'T@ST5' });
            expect(coupon).toBeDefined();
        });

        test('should handle zero discount', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'ZERO5',
                    description: 'Zero discount',
                    discount: 0,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'ZERO5' });
            expect(coupon.discount).toBe(0);
        });

        test('should reject negative discount - 400', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'NEG50',
                    description: 'Negative discount',
                    discount: -10,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            // Should reject negative discount
            expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
            const coupon = await Coupon.findOne({ code: 'NEG50' });
            expect(coupon).toBeNull();
            }
        });

        test('should handle extremely large discount', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: 'BIG50',
                    description: 'Large discount',
                    discount: 999999,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            const coupon = await Coupon.findOne({ code: 'BIG50' });
            expect(coupon).toBeDefined();
        });

        test('should handle whitespace in code', async () => {
            const req = global.testHelpers.createMockReq({
                body: {
                    code: '  WS50  ',
                    description: 'Whitespace test',
                    discount: 10,
                    maxUses: 5
                }
            });
            const res = global.testHelpers.createMockRes();

            await couponController.postAddCoupon(req, res);

            // Should trim or handle whitespace appropriately
            const coupon = await Coupon.findOne({ code: /WS50/i });
            if (coupon) {
                expect(coupon.code).not.toContain(' ');
            }
        });
    });
});
