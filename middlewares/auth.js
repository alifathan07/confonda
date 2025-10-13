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
  if (req.session.user && req.session.user.role === 'admin' || req.session.user.role === 'grandadmin') {
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


export const isUser = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'user') {
      next();
  } else {
      res.redirect('/achats');
  }
}

