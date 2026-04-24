export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
      next();
  } else {
      res.redirect('/');
  }
}

export const redirectIfLoggedIn = (req, res, next) =>{
  if (req.session && req.session.user) {
      return res.redirect('/dashboard');
  }
  next();
}

export const isAdmin = (req, res, next) => {
  const role = req.session.user?.role;
  if (role === 'admin' || role === 'grandadmin' || role === 'developer') {
      next();
  } else {
      res.redirect('/achats');
  }
}

export const isGrandAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'grandadmin') {
      next();
  } else {
      res.redirect('/dashboard');
  }
}

export const isDeveloper = (req, res, next) => {
  const role = req.session.user?.role;
  // Developer has full access like grandadmin for bug/popup management
  if (role === 'developer' || role === 'grandadmin') {
      next();
  } else {
      res.redirect('/dashboard');
  }
}

// Only admin, grandadmin, and granduser can create bugs


export const isUser = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'user') {
      next();
  } else {
      res.redirect('/achats');
  }
}

