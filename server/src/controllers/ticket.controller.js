const ticketService = require('../services/ticket.service');
const { successResponse } = require('../utils/responseHandler');

class TicketController {
  // Create ticket
  async createTicket(req, res, next) {
    try {
      const ticket = await ticketService.createTicket(req.body, req.user._id);
      successResponse(res, 201, 'Ticket created successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
  

// Get all tickets - No role restrictions
async getAllTickets(req, res, next) {
  try {
    const result = await ticketService.getAllTickets(req.query);
    successResponse(res, 200, 'Tickets retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}

// Get statistics - No role restrictions
async getTicketStatistics(req, res, next) {
  try {
    const stats = await ticketService.getTicketStatistics();
    successResponse(res, 200, 'Statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
}
  
  // Get ticket by ID
  async getTicketById(req, res, next) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      successResponse(res, 200, 'Ticket retrieved successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
  
  // Update ticket
  async updateTicket(req, res, next) {
    try {
      const ticket = await ticketService.updateTicket(
        req.params.id,
        req.body,
        req.user._id
      );
      successResponse(res, 200, 'Ticket updated successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
  
  // Delete ticket (soft)
  async deleteTicket(req, res, next) {
    try {
      await ticketService.deleteTicket(req.params.id);
      successResponse(res, 200, 'Ticket deleted successfully');
    } catch (error) {
      next(error);
    }
  }
  
  // Hard delete ticket (Admin only)
  async hardDeleteTicket(req, res, next) {
    try {
      await ticketService.hardDeleteTicket(req.params.id);
      successResponse(res, 200, 'Ticket permanently deleted');
    } catch (error) {
      next(error);
    }
  }
  
  // Update ticket status
  async updateTicketStatus(req, res, next) {
    try {
      const ticket = await ticketService.updateTicketStatus(
        req.params.id,
        req.body.ticketStatus,
        req.user._id
      );
      successResponse(res, 200, 'Ticket status updated successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
  
  // Assign ticket to user
  async assignTicket(req, res, next) {
    try {
      const ticket = await ticketService.assignTicket(
        req.params.id,
        req.body.assignedTo,
        req.user._id
      );
      successResponse(res, 200, 'Ticket assigned successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
  
  // Add comment to ticket
  async addComment(req, res, next) {
    try {
      const ticket = await ticketService.addComment(
        req.params.id,
        req.body.comment,
        req.user._id
      );
      successResponse(res, 200, 'Comment added successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
  
  // Get tickets by deal
  async getTicketsByDeal(req, res, next) {
    try {
      const tickets = await ticketService.getTicketsByDeal(req.params.dealId);
      successResponse(res, 200, 'Tickets retrieved successfully', { tickets });
    } catch (error) {
      next(error);
    }
  }
  
  // Get tickets by company
  async getTicketsByCompany(req, res, next) {
    try {
      const tickets = await ticketService.getTicketsByCompany(req.params.companyId);
      successResponse(res, 200, 'Tickets retrieved successfully', { tickets });
    } catch (error) {
      next(error);
    }
  }
  
  // Bulk delete tickets
  async bulkDeleteTickets(req, res, next) {
    try {
      const results = await ticketService.bulkDeleteTickets(req.body.ticketIds);
      successResponse(res, 200, 'Bulk delete completed', results);
    } catch (error) {
      next(error);
    }
  }
  
  // Upload attachment
  async uploadAttachment(req, res, next) {
    try {
      const attachment = await ticketService.uploadAttachment(
        req.params.id,
        req.body,
        req.user._id
      );
      successResponse(res, 201, 'Attachment uploaded successfully', attachment);
    } catch (error) {
      next(error);
    }
  }
  
  // Delete attachment
  async deleteAttachment(req, res, next) {
    try {
      await ticketService.deleteAttachment(
        req.params.ticketId,
        req.params.attachmentId
      );
      successResponse(res, 200, 'Attachment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketController();