// Đảm bảo các collections cần thiết được tạo
db = db.getSiblingDB('sourcecomputer');

// Kiểm tra nếu không có dữ liệu, chạy các seeders
if (db.users.countDocuments() === 0) {
  print("Database trống, khởi tạo dữ liệu admin...");
  
  // Tạo admin user
  db.users.insertOne({
    name: "Admin",
    email: "admin@sourcecomputer.vn",
    // Mật khẩu: admin123 (đã được hash bằng bcrypt)
    password: "$2a$12$5VdEk2/GyR7dvlFFvEHL1OWw6DaYyvRfHDLMra.YpsKr7jBCdh/wy",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  print("Admin user đã được tạo!");
}

print("MongoDB initialization completed!");