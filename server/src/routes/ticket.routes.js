const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createTicketValidation,
  updateTicketValidation
} = require('../validators/ticket.validator');

// All routes require authentication
router.use(protect);

// Ticket CRUD
router.post('/', createTicketValidation, validate, ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.get('/statistics', ticketController.getTicketStatistics);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', updateTicketValidation, validate, ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

// Admin only - hard delete
router.delete('/:id/permanent', ticketController.hardDeleteTicket);

// Ticket actions
router.patch('/:id/status', ticketController.updateTicketStatus);
router.patch('/:id/assign', ticketController.assignTicket);
router.post('/:id/comments', ticketController.addComment);

// Bulk operations
router.post('/bulk/delete', ticketController.bulkDeleteTickets);

// Get tickets by relation
router.get('/deal/:dealId', ticketController.getTicketsByDeal);
router.get('/company/:companyId', ticketController.getTicketsByCompany);

// Attachments
router.post('/:id/attachments', ticketController.uploadAttachment);
router.delete('/:ticketId/attachments/:attachmentId', ticketController.deleteAttachment);

module.exports = router;