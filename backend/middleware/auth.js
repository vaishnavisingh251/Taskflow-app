const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. No token.' });

  // Check if token has been invalidated (logged out)
  if (req.app.locals.tokenBlacklist?.has(token)) {
    return res.status(401).json({ message: 'Token has been invalidated. Please log in again.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token; // attach raw token for logout use
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};