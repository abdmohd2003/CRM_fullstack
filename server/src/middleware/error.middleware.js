const { errorResponse } = require('../utils/responseHandler');
const env = require('../config/env');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for debugging
  console.error('Error:', err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return errorResponse(res, 404, message);
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return errorResponse(res, 400, message);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return errorResponse(res, 400, messages[0]);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired');
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // In production, don't expose stack traces
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    return errorResponse(res, 500, 'Something went wrong');
  }
  
  return errorResponse(res, statusCode, message);
};

module.exports = errorHandler;