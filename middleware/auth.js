const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    // Verify token
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await User.findById(verified._id);
    if (!user) return res.status(401).json({ message: 'Access denied' });

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};
