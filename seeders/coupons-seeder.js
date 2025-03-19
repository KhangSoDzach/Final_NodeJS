const mongoose = require('mongoose');
const Coupon = require('../models/coupon');
require('dotenv').config();

const demoCoupons = [
  {
    code: 'NEW10',
    description: 'Giảm 10% cho khách hàng mới',
    discount: 10,
    minAmount: 1000000,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    maxUses: 100,
    active: true
  },
  {
    code: 'CPU20',
    description: 'Giảm 20% cho các sản phẩm CPU',
    discount: 20,
    minAmount: 5000000,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    maxUses: 50,
    active: true
  },
  {
    code: 'DEAL5',
    description: 'Giảm 5% cho mọi đơn hàng',
    discount: 5,
    minAmount: 500000,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    maxUses: 200,
    active: true
  }
];

async function seedDemoCoupons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if coupons already exist
    const existingCouponsCount = await Coupon.countDocuments();
    if (existingCouponsCount > 0) {
      console.log(`${existingCouponsCount} coupons already exist. Skipping seeding.`);
      await mongoose.connection.close();
      return;
    }

    // Insert demo coupons
    await Coupon.insertMany(demoCoupons);
    console.log(`${demoCoupons.length} demo coupons seeded successfully`);

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding demo coupons:', error);
    process.exit(1);
  }
}

seedDemoCoupons();
