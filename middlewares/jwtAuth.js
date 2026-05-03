import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'confonda_jwt_secret';

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || '7d',
  });
}

  export function verifyJwt(req, res, next) {
    try {
      const header = req.headers.authorization || req.headers.Authorization;
      const value = Array.isArray(header) ? header[0] : header;
      
      if (!value || typeof value !== 'string' || !value.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing Authorization Bearer token' });
      }

      const token = value.slice('Bearer '.length).trim();
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log(header)
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.length) return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}
