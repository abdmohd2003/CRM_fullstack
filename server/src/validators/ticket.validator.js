const { body } = require('express-validator');

const createTicketValidation = [
  body('ticketName')
    .trim()
    .notEmpty().withMessage('Ticket name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Ticket name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('ticketStatus')
    .optional()
    .isIn(['New', 'Waiting on contact', 'Waiting on us', 'In Progress', 'Closed', 'Resolved', 'Cancelled'])
    .withMessage('Invalid ticket status'),
  
  body('priority')
    .optional()
    .isIn(['Critical', 'High', 'Medium', 'Low'])
    .withMessage('Invalid priority'),
  
  body('source')
    .optional()
    .isIn(['Email', 'Chat', 'Phone', 'Website', 'Social Media', 'Other'])
    .withMessage('Invalid source'),
  
  body('ticketOwner')
    .notEmpty().withMessage('Ticket owner is required'),
  
  body('associatedDeal')
    .optional(),
  
  body('associatedCompany')
    .optional()
];

const updateTicketValidation = [
  body('ticketName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  
  body('ticketStatus')
    .optional()
    .isIn(['New', 'Waiting on contact', 'Waiting on us', 'In Progress', 'Closed', 'Resolved', 'Cancelled']),
  
  body('priority')
    .optional()
    .isIn(['Critical', 'High', 'Medium', 'Low']),
  
  body('source')
    .optional()
    .isIn(['Email', 'Chat', 'Phone', 'Website', 'Social Media', 'Other']),
  
  body('ticketOwner')
    .optional()
];

module.exports = {
  createTicketValidation,
  updateTicketValidation
};