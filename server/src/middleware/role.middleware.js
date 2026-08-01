const { errorResponse } = require('../utils/responseHandler');

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Not authorized');
    }
    
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, `Role ${req.user.role} is not authorized to access this route`);
    }
    
    next();
  };
};

/**
 * Check if user owns the resource or is admin
 * @param {string} paramName - Parameter name containing the user ID
 */
const checkOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName];
    const currentUserId = req.user._id.toString();
    
    // Admin can access any resource
    if (req.user.role === 'Admin') {
      return next();
    }
    
    // Check if user is accessing their own resource
    if (resourceUserId === currentUserId) {
      return next();
    }
    
    return errorResponse(res, 403, 'You can only access your own resources');
  };
};

module.exports = { authorize, checkOwnership };