module.exports = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'lexa61313@gmail.com',
    // Option 1: Use App Password (recommended for simpler setup)
    pass: process.env.EMAIL_PASSWORD || 'dobd uiws oupm hixj',
    
    // Option 2: OAuth2 authentication - uncomment these lines and comment out the "pass" line above
    // clientId: process.env.EMAIL_CLIENT_ID,
    // clientSecret: process.env.EMAIL_CLIENT_SECRET, 
    // refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    // accessToken: process.env.EMAIL_ACCESS_TOKEN,
  },
  tls: {
    rejectUnauthorized: false // Only for development to avoid self-signed certificate issues
  }
};
