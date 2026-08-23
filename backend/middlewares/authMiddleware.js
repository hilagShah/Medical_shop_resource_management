const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account has been deactivated' });
      }

      // Check shopkeeper subscription status
      if (req.user.role === 'shopkeeper') {
        const isExpired = req.user.subscriptionExpiresAt && new Date(req.user.subscriptionExpiresAt) < new Date();
        const isOverdue = req.user.paymentStatus === 'overdue' || isExpired;

        if (isExpired && req.user.paymentStatus !== 'overdue') {
          req.user.paymentStatus = 'overdue';
          await User.findByIdAndUpdate(req.user._id, { paymentStatus: 'overdue' });
        }

        // If payment is overdue and requesting anything other than auth status/me, block access
        const isAuthMe = req.baseUrl === '/api/auth' || req.originalUrl?.includes('/api/auth/me');
        if (isOverdue && !isAuthMe) {
          return res.status(403).json({
            message: 'Your monthly/yearly subscription has expired. Please contact the administrator to renew access.',
            code: 'PAYMENT_REQUIRED',
            paymentStatus: 'overdue',
            subscriptionExpiresAt: req.user.subscriptionExpiresAt,
          });
        }
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { generateToken, protect, authorize };
