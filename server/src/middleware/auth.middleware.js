// src/middleware/auth.middleware.js
const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHandler');

const protect = async (req, res, next) => {
  try {
    let token;
    
    // Debug: Log all headers
    console.log('📋 Request Headers:', req.headers);
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found:', token.substring(0, 50) + '...');
    } else {
      console.log('❌ No Bearer token found in Authorization header');
      console.log('Authorization header value:', req.headers.authorization);
    }
    
    if (!token) {
      return errorResponse(res, 401, 'Not authorized to access this route. No token provided.');
    }
    
    // Verify token
    const decoded = verifyToken(token);
    console.log('🔓 Decoded token:', decoded);
    
    if (!decoded) {
      return errorResponse(res, 401, 'Invalid or expired token');
    }
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    console.log('👤 User found:', user ? user.email : 'NOT FOUND');
    
    if (!user) {
      return errorResponse(res, 401, 'User no longer exists');
    }
    
    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 401, 'Your account has been deactivated');
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('🔥 Auth middleware error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

module.exports = { protect };