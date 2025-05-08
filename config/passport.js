const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Cart = require('../models/cart');

module.exports = function(passport) {
  // Local Strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
          return done(null, false, { message: 'Email hoặc mật khẩu không chính xác' });
        }
        
        // Check if user has a password (Google users won't have one)
        if (!user.password) {
          return done(null, false, { 
            message: 'Tài khoản này được đăng nhập thông qua Google. Vui lòng sử dụng đăng nhập Google.' 
          });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Email hoặc mật khẩu không chính xác' });
        }
        
        // Password matched
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Google Strategy (if configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost/auth/google/callback',
        passReqToCallback: true // Bật tùy chọn này để truy cập req trong callback
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google authentication started for profile:', profile.id);
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            console.log('Existing Google user found:', user.email);
            // Return existing user
            return done(null, user);
          }
          
          // Check if user with this email already exists
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            console.log('Linking Google ID to existing user:', user.email);
            // Link Google ID to existing user
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }
          
          console.log('Creating new Google user:', profile.emails[0].value);
          // Create new user
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            role: 'customer',
            loyaltyPoints: 0
          });
          
          await newUser.save();
          
          // Move guest cart to user cart if exists
          if (req.session && req.session.cartId) {
            const guestCart = await Cart.findOne({ sessionId: req.session.cartId });
            
            if (guestCart) {
              guestCart.user = newUser._id;
              guestCart.sessionId = null;
              await guestCart.save();
              
              delete req.session.cartId;
            }
          }
          
          return done(null, newUser);
        } catch (err) {
          console.error('Google authentication error:', err);
          return done(err);
        }
      }
    ));
  }

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
