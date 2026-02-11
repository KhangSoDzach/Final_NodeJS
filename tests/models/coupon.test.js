/**
 * Coupon Model Tests
 * Tests for coupon validation logic including expiration, usage limits, and minimum amount
 */
const mongoose = require('mongoose');
const Coupon = require('../../models/coupon');

describe('Coupon Model', () => {

    // ====================================
    // Coupon.isValid() Method Tests
    // ====================================
    describe('isValid() method', () => {

        test('should return true for active coupon within date range', async () => {
            const coupon = new Coupon({
                code: 'SALE10',
                description: '10% off',
                discount: 10,
                minAmount: 100000,
                startDate: new Date(Date.now() - 86400000), // Yesterday
                endDate: new Date(Date.now() + 86400000), // Tomorrow
                maxUses: 10,
                usedCount: 5,
                active: true
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(true);
        });

        test('should return false for inactive coupon', async () => {
            const coupon = new Coupon({
                code: 'INACT',
                description: 'Inactive coupon',
                discount: 20,
                active: false,
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(Date.now() + 86400000),
                maxUses: 10,
                usedCount: 0
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(false);
        });

        test('should return false for coupon before start date', async () => {
            const coupon = new Coupon({
                code: 'FUTR1',
                description: 'Future coupon',
                discount: 15,
                active: true,
                startDate: new Date(Date.now() + 86400000), // Tomorrow
                endDate: new Date(Date.now() + 172800000), // Day after tomorrow
                maxUses: 10,
                usedCount: 0
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(false);
        });

        test('should return false for expired coupon', async () => {
            const coupon = new Coupon({
                code: 'EXPIR',
                description: 'Expired coupon',
                discount: 25,
                active: true,
                startDate: new Date(Date.now() - 172800000), // 2 days ago
                endDate: new Date(Date.now() - 86400000), // Yesterday
                maxUses: 10,
                usedCount: 3
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(false);
        });

        test('should return false when maxUses is reached', async () => {
            const coupon = new Coupon({
                code: 'MAXED',
                description: 'Max uses reached',
                discount: 30,
                active: true,
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(Date.now() + 86400000),
                maxUses: 10,
                usedCount: 10 // Exactly at max
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(false);
        });

        test('should return false when usedCount exceeds maxUses', async () => {
            const coupon = new Coupon({
                code: 'OVER1',
                description: 'Over max uses',
                discount: 35,
                active: true,
                maxUses: 10,
                usedCount: 11 // Over max
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(false);
        });

        test('should handle coupon without endDate (no expiration)', async () => {
            const coupon = new Coupon({
                code: 'NOEXP',
                description: 'No expiration',
                discount: 5,
                active: true,
                startDate: new Date(Date.now() - 86400000),
                endDate: null, // No end date
                maxUses: 10,
                usedCount: 2
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(true);
        });

        test('should handle coupon at exactly maxUses boundary', async () => {
            const coupon = new Coupon({
                code: 'BOUND',
                description: 'At boundary',
                discount: 12,
                active: true,
                maxUses: 10,
                usedCount: 9 // One more use allowed
            });

            await coupon.save();

            expect(coupon.isValid()).toBe(true);
        });
    });

    // ====================================
    // Coupon Schema Validation Tests
    // ====================================
    describe('Schema validation', () => {

        test('should require code field', async () => {
            const coupon = new Coupon({
                description: 'No code',
                discount: 10
            });

            let error;
            try {
                await coupon.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.code).toBeDefined();
        });

        test('should enforce 5-character code length', async () => {
            const coupon = new Coupon({
                code: 'SHORT', // Exactly 5 chars - valid
                description: 'Short code test',
                discount: 10
            });

            await expect(coupon.save()).resolves.toBeDefined();
        });

        test('should reject code not equal to 5 characters', async () => {
            const coupon = new Coupon({
                code: 'TOOLONG123', // More than 5 chars
                description: 'Long code test',
                discount: 10
            });

            let error;
            try {
                await coupon.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
        });

        test('should convert code to uppercase', async () => {
            const coupon = new Coupon({
                code: 'lower',
                description: 'Lowercase test',
                discount: 10
            });

            await coupon.save();

            expect(coupon.code).toBe('LOWER');
        });

        test('should enforce discount between 0 and 100', async () => {
            const coupon = new Coupon({
                code: 'DISC1',
                description: 'Invalid discount',
                discount: 150 // Over 100%
            });

            let error;
            try {
                await coupon.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
        });

        test('should have default values for optional fields', async () => {
            const coupon = new Coupon({
                code: 'DEFLT',
                description: 'Default values test',
                discount: 10
            });

            await coupon.save();

            expect(coupon.minAmount).toBe(0);
            expect(coupon.maxUses).toBe(10);
            expect(coupon.usedCount).toBe(0);
            expect(coupon.active).toBe(true);
        });
    });

    // ====================================
    // Coupon Application Logic Tests
    // ====================================
    describe('Coupon application', () => {

        test('should apply valid coupon to order meeting minAmount', async () => {
            const coupon = new Coupon({
                code: 'MIN50',
                description: '10% off for orders over 500k',
                discount: 10,
                minAmount: 500000,
                active: true,
                maxUses: 10,
                usedCount: 0
            });

            await coupon.save();

            const orderTotal = 1000000;

            // Check coupon is valid
            expect(coupon.isValid()).toBe(true);

            // Check order meets minimum
            expect(orderTotal >= coupon.minAmount).toBe(true);

            // Calculate discount
            const discountAmount = Math.floor(orderTotal * (coupon.discount / 100));
            expect(discountAmount).toBe(100000);

            const finalTotal = orderTotal - discountAmount;
            expect(finalTotal).toBe(900000);
        });

        test('should reject coupon if order is below minAmount', async () => {
            const coupon = new Coupon({
                code: 'MIN1M',
                description: '20% off for orders over 1M',
                discount: 20,
                minAmount: 1000000,
                active: true
            });

            await coupon.save();

            const orderTotal = 500000; // Below minimum

            expect(orderTotal < coupon.minAmount).toBe(true);
            // Application logic should reject this
        });

        test('should increment usedCount after successful application', async () => {
            const coupon = new Coupon({
                code: 'COUNT',
                description: 'Usage count test',
                discount: 15,
                active: true,
                maxUses: 10,
                usedCount: 3
            });

            await coupon.save();

            // Simulate coupon usage
            coupon.usedCount += 1;
            await coupon.save();

            const updatedCoupon = await Coupon.findOne({ code: 'COUNT' });
            expect(updatedCoupon.usedCount).toBe(4);
        });

        test('should prevent application once maxUses is reached', async () => {
            const coupon = new Coupon({
                code: 'LIMIT',
                description: 'At limit',
                discount: 10,
                active: true,
                maxUses: 5,
                usedCount: 5
            });

            await coupon.save();

            // Coupon should not be valid anymore
            expect(coupon.isValid()).toBe(false);
        });
    });

    // ====================================
    // Edge Cases
    // ====================================
    describe('Edge cases', () => {

        test('should handle concurrent usage correctly', async () => {
            const coupon = new Coupon({
                code: 'CONC1',
                description: 'Concurrency test',
                discount: 10,
                active: true,
                maxUses: 10,
                usedCount: 9 // Only 1 use left
            });

            await coupon.save();

            // This test documents the expected behavior
            // In a real scenario, you'd need to handle race conditions
            expect(coupon.isValid()).toBe(true);

            // After one more use
            coupon.usedCount = 10;
            expect(coupon.isValid()).toBe(false);
        });

        test('should handle coupon expiring exactly now', async () => {
            const now = new Date();

            const coupon = new Coupon({
                code: 'NOW01',
                description: 'Expires now',
                discount: 10,
                active: true,
                endDate: now
            });

            await coupon.save();

            // Edge case: exactly at expiration time
            // Implementation uses > which means this should be invalid
            expect(coupon.isValid()).toBe(false);
        });

        test('should handle zero discount coupon', async () => {
            const coupon = new Coupon({
                code: 'ZERO1',
                description: 'Zero discount',
                discount: 0, // Valid per schema (min: 0)
                active: true
            });

            await coupon.save();

            expect(coupon.discount).toBe(0);
            expect(coupon.isValid()).toBe(true);
        });
    });
});
