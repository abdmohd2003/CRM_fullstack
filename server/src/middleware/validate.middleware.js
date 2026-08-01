const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHandler');

/**
 * Middleware to validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return errorResponse(res, 400, errorMessages[0]);
  }
  
  next();
};

module.exports = validate;