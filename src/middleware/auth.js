export function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect('/login');
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (req.session.user && (Array.isArray(roles) ? roles.includes(req.session.user.role) : req.session.user.role === roles)) {
      return next();
    }

    return res.status(403).send('Acceso denegado');
  };
}

