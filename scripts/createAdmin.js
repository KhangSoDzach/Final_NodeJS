const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Chữ "U" viết hoa
const session = require('express-session');
const MongoStore = require('connect-mongo');

mongoose.connect('mongodb://localhost:27017/your-database', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(session({
  secret: 'e2f3c4d5e6f7a8b9c0d1e2f3c4d5e6f7a8b9c0d1e2f3c4d5e6f7a8b9c0d1e2f3',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/sourcecomputer' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 ngày
}));

const createAdmin = async () => {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
    });

    await admin.save();
    console.log('Admin account created!');
    mongoose.disconnect();
};

createAdmin();