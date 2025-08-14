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