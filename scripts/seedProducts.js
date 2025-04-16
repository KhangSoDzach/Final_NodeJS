const mongoose = require('mongoose');
const Product = require('../models/product'); // Đường dẫn đến model Product
const products = require('../json/products.json'); // Đường dẫn đến file JSON chứa dữ liệu sản phẩm
require('dotenv').config(); // Thêm để đọc các biến môi trường từ .env

// Kết nối đến MongoDB
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer';

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Kết nối MongoDB thành công!');
  console.log(`Kết nối tới: ${dbUri}`);
}).catch(err => {
  console.error('Lỗi kết nối MongoDB:', err);
  process.exit(1);
});

// Kiểm tra dữ liệu trước khi thêm
console.log(`Đọc được ${products.length} sản phẩm từ tệp JSON`);
if (products.length === 0) {
  console.error('Không tìm thấy dữ liệu sản phẩm trong file JSON!');
  mongoose.connection.close();
  process.exit(1);
}

// Seed dữ liệu sản phẩm
const seedProducts = async () => {
  try {
    // Xóa tất cả sản phẩm hiện có (nếu cần)
    const deleteResult = await Product.deleteMany({});
    console.log(`Xóa dữ liệu cũ thành công: ${deleteResult.deletedCount} sản phẩm đã bị xóa.`);

    // Thêm dữ liệu mới từ file JSON
    const insertResult = await Product.insertMany(products);
    console.log(`Thêm dữ liệu sản phẩm thành công: ${insertResult.length} sản phẩm đã được thêm.`);

    // Đóng kết nối
    mongoose.connection.close();
  } catch (err) {
    console.error('Lỗi khi thêm dữ liệu sản phẩm:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Chạy seed script
seedProducts();
