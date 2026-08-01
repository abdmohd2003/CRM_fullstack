/**
 * Standard success response handler
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object} data - Response data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard error response handler
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
const errorResponse = (res, statusCode = 400, message = 'Error occurred') => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { successResponse, errorResponse };