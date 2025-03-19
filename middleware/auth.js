exports.isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Vui lòng đăng nhập để tiếp tục.');
  res.redirect(`/auth/login?returnTo=${req.originalUrl}`);
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Bạn không có quyền truy cập trang này.');
  res.redirect('/');
};

exports.isGuest = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};
