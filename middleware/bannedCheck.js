// Check if user is banned on each request
const bannedCheck = (req, res, next) => {
  // If the user is logged in and banned
  if (req.isAuthenticated() && req.user && req.user.isBanned) {
    // Logout the user
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      // Redirect to login page with banned flag without flash message
      // Flash message will be handled in login route based on banned parameter
      return res.redirect('/auth/login?banned=true');
    });
  } else {
    // User is not banned, proceed
    return next();
  }
};

module.exports = bannedCheck;
