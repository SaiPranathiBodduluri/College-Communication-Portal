const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    // Find user based on role from token
    if (decoded.role === 'student') {
      user = await Student.findById(decoded.userId).select('-password');
    } else if (decoded.role === 'faculty') {
      user = await Faculty.findById(decoded.userId).select('-password');
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.userId).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Attach user with role to request
    req.user = { ...user.toObject(), role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { auth, authorize };