module.exports.isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Bạn cần đăng nhập để tiếp tục.');
  res.redirect('/auth/login');
};

// Middleware mới cho phép cả khách và người dùng đã đăng nhập
exports.allowGuest = (req, res, next) => {
  // Cho phép mọi người truy cập, đã đăng nhập hoặc chưa
  return next();
};

exports.isAdmin = (req, res, next) => {
    console.log('IsAdmin middleware check:', {
        sessionId: req.session.id,
        sessionUser: req.session.user ? req.session.user.email : 'no session user',
        passportUser: req.user ? req.user.email : 'no passport user',
        sessionIsAdmin: req.session.isAdmin,
        userRole: req.user ? req.user.role : 'no role',
        path: req.path
    });
    
    if (req.session.isAdmin === true || 
        (req.session.user && req.session.user.role === 'admin') || 
        (req.user && req.user.role === 'admin')) {
        console.log('Admin access granted');
        return next();
    }
    
    console.log('Admin access denied');
    req.flash('error', 'Bạn không có quyền truy cập trang quản trị.');
    return res.redirect('/auth/login');
};

exports.isGuest = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};

exports.setLocals = (req, res, next) => {
    res.locals.user = req.user;
    res.locals.isAuthenticated = req.session.isAuthenticated;
    res.locals.isAdmin = req.session.isAdmin || (req.user && req.user.role === 'admin');
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentPath = req.path;
    next();
};
