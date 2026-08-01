const { body } = require('express-validator');

const createCompanyValidation = [
  body('domainName')
    .trim()
    .notEmpty().withMessage('Domain name is required')
    .isURL().withMessage('Please provide a valid domain URL'),
  
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
  
  body('industry')
    .trim()
    .notEmpty().withMessage('Industry is required'),
  
  body('type')
    .trim()
    .notEmpty().withMessage('Company type is required'),
  
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  
  body('noOfEmployees')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid employee range'),
  
  body('leadStatus')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Inactive']),
  
  body('city')
    .optional()
    .trim(),
  
  body('countryRegion')
    .optional()
    .trim(),
  
  body('annualRevenue')
    .optional()
    .isNumeric().withMessage('Annual revenue must be a number')
    .isInt({ min: 0 }).withMessage('Annual revenue must be a positive number')
];

const updateCompanyValidation = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  
  body('phoneNumber')
    .optional()
    .trim(),
  
  body('email')
    .optional()
    .isEmail(),
  
  body('leadStatus')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Inactive']),
  
  body('industry')
    .optional()
    .trim(),
  
  body('city')
    .optional()
    .trim(),
  
  body('countryRegion')
    .optional()
    .trim(),
  
  body('aiSummary')
    .optional()
    .trim()
];

module.exports = {
  createCompanyValidation,
  updateCompanyValidation
};