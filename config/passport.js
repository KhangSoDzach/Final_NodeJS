const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Cart = require('../models/cart');

// Local strategy (username/password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        
        if (!user) {
          return done(null, false, { message: 'Email không tồn tại trong hệ thống.' });
        }
        
        // Skip password check for Google OAuth users
        if (!user.password) {
          return done(null, false, { message: 'Tài khoản này đăng nhập qua Google. Vui lòng sử dụng đăng nhập với Google.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Mật khẩu không chính xác.' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // Check if email already exists
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }
        
        // Create new user
        const newUser = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          role: 'customer'
        });
        
        await newUser.save();
        
        // Move guest cart to user cart if exists
        if (profile.req && profile.req.session && profile.req.session.cartId) {
          const guestCart = await Cart.findOne({ sessionId: profile.req.session.cartId });
          
          if (guestCart) {
            guestCart.user = newUser._id;
            guestCart.sessionId = null;
            await guestCart.save();
            
            delete profile.req.session.cartId;
          }
        }
        
        return done(null, newUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
