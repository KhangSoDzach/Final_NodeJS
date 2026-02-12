/**
 * Coupons Seeder - Tạo mã giảm giá mẫu
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../models/coupon');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer';

const demoCoupons = [
  {
    code: "NEWCM",
    description: "Giảm giá 10% cho khách hàng mới",
    discount: 10,
    minAmount: 1000000,
    maxUses: 10,
    usedCount: 0,
    active: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 ngày
  },
  {
    code: "SUPER",
    description: "Giảm giá 15% cho đơn hàng trên 5 triệu",
    discount: 15,
    minAmount: 5000000,
    maxUses: 10,
    usedCount: 0,
    active: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 ngày
  },
  {
    code: "FLASH",
    description: "Giảm giá 20% cho flash sale",
    discount: 20,
    minAmount: 3000000,
    maxUses: 5,
    usedCount: 0,
    active: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
  },
  {
    code: "BIGPC",
    description: "Giảm giá 5% cho PC gaming",
    discount: 5,
    minAmount: 15000000,
    maxUses: 10,
    usedCount: 0,
    active: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày
  },
  {
    code: "ACCES",
    description: "Giảm giá 25% cho phụ kiện",
    discount: 25,
    minAmount: 500000,
    maxUses: 8,
    usedCount: 0,
    active: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 ngày
  }
];

async function seedCoupons() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra xem đã có coupon chưa
    const existingCount = await Coupon.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Already have ${existingCount} coupons in database. Skipping seed.`);
      console.log('To re-seed, delete existing coupons first.');
    } else {
      // Insert demo coupons
      const result = await Coupon.insertMany(demoCoupons);
      console.log(`${result.length} demo coupons created successfully!`);
      console.log('\nAvailable coupon codes:');
      demoCoupons.forEach(c => {
        console.log(`  - ${c.code}: ${c.description}`);
      });
    }

  } catch (error) {
    console.error('Error seeding coupons:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedCoupons();
