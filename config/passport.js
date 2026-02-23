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
        callbackURL: process.env.GOOGLE_CALLBACK_URL ||
          (process.env.RENDER_EXTERNAL_URL
            ? `${process.env.RENDER_EXTERNAL_URL}/auth/google/callback`
            : 'http://localhost:3000/auth/google/callback'),
        passReqToCallback: true
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
          
          console.log('New Google user needs OTP verification:', profile.emails[0].value);
          // Signal to controller that OTP verification is needed before creating account
          return done(null, {
            needsGoogleOtp: true,
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos?.[0]?.value || null
          });
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
      // If user is banned, they should not be authorized
      if (user && user.isBanned) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
