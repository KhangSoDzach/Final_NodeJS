/**
 * Direct seeder for MongoDB Atlas - bypasses .env
 */
const mongoose = require('mongoose');

// Atlas connection string
const ATLAS_URI = 'mongodb+srv://lexa61313_db_user:K1QIOtGjtMrwRwm9@sourcecomputer.dttg4ej.mongodb.net/sourcecomputer?retryWrites=true&w=majority&appName=SourceComputer';

async function seedAtlas() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Import seeders
    const adminSeeder = require('./seeders/admin-seeder');
    const productsSeeder = require('./seeders/demo-products-seeder');
    const couponsSeeder = require('./seeders/coupons-seeder');

    console.log('\n📦 Seeding admin user...');
    await adminSeeder;

    console.log('\n📦 Seeding products...');
    await productsSeeder;

    console.log('\n📦 Seeding coupons...');
    await couponsSeeder;

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedAtlas();
