module.exports = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'lexa61313@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'dobd uiws oupm hixj',
  
  },
  tls: {
    rejectUnauthorized: false // Only for development to avoid self-signed certificate issues
  }
};
