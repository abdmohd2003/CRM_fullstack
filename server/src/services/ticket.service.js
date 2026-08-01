const Ticket = require('../models/Ticket');
const Deal = require('../models/Deal');
const Company = require('../models/Company');
const ApiError = require('../utils/ApiError');

class TicketService {
  // Create ticket
 // ==========================================
  // CREATE TICKET
  // ==========================================
  async createTicket(ticketData, userId) {
    const associatedDeal = ticketData.associatedDeal === "" ? null : ticketData.associatedDeal;
    const associatedCompany = ticketData.associatedCompany === "" ? null : ticketData.associatedCompany;
    
    const ticket = await Ticket.create({
      ticketName: ticketData.ticketName,
      description: ticketData.description || "",
      ticketStatus: ticketData.ticketStatus,
      source: ticketData.source,
      priority: ticketData.priority,
      associatedDeal: associatedDeal,
      associatedCompany: associatedCompany,
      createdBy: userId,
      ticketOwner: ticketData.ticketOwner || userId
    });
    
    ticket.activityLog.push({
      action: 'created',
      description: `Ticket "${ticket.ticketName}" was created`,
      performedBy: userId
    });
    await ticket.save();
    
    // 👇 Requesting 'name amount stage' explicitly matching your Deal model fields
    return await Ticket.findById(ticket._id)
      .populate('ticketOwner', 'firstName lastName email')
      .populate('associatedDeal', 'name amount stage') 
      .populate('associatedCompany', 'companyName domainName');
  }

  // ==========================================
  // UPDATE TICKET
  // ==========================================
  async updateTicket(ticketId, updateData, userId) {
    if (updateData.associatedDeal === "") updateData.associatedDeal = null;
    if (updateData.associatedCompany === "") updateData.associatedCompany = null;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    ticket.activityLog.push({
      action: 'updated',
      description: `Ticket "${ticket.ticketName}" was updated`,
      performedBy: userId
    });
    await ticket.save();

    // 👇 Populating matching fields here too
    return await Ticket.findById(ticket._id)
      .populate('ticketOwner', 'firstName lastName email')
      .populate('associatedDeal', 'name amount stage')
      .populate('associatedCompany', 'companyName domainName');
  }
    
  // Get all tickets with filters - ✅ NO ROLE RESTRICTIONS
  async getAllTickets(filters) {
    const query = { isActive: true };
    
    // ✅ Improved search with $or for multiple fields
    if (filters.search) {
      query.$or = [
        { ticketName: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
        { ticketStatus: { $regex: filters.search, $options: "i" } },
        { source: { $regex: filters.search, $options: "i" } }
      ];
    }
    
    if (filters.ticketStatus && filters.ticketStatus !== 'all') {
      query.ticketStatus = filters.ticketStatus;
    }
    
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }
    
    if (filters.source && filters.source !== 'all') {
      query.source = filters.source;
    }
    
    if (filters.ticketOwner) {
      query.ticketOwner = filters.ticketOwner;
    }
    
    if (filters.associatedDeal) {
      query.associatedDeal = filters.associatedDeal;
    }
    
    if (filters.associatedCompany) {
      query.associatedCompany = filters.associatedCompany;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('ticketOwner', 'firstName lastName email')
        .populate('associatedDeal', 'name amount stage')
        .populate('associatedCompany', 'companyName domainName')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .populate('attachments.uploadedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query)
    ]);
    
    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
  
  // Get ticket by ID - ✅ NO ROLE RESTRICTIONS
  async getTicketById(ticketId) {
    const ticket = await Ticket.findById(ticketId)
      .populate('ticketOwner', 'firstName lastName email')
      .populate('associatedDeal', 'name amount stage')
      .populate('associatedCompany', 'companyName domainName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('activityLog.performedBy', 'firstName lastName email')
      .populate('attachments.uploadedBy', 'firstName lastName email');
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    return ticket;
  }
  
  // Update ticket - ✅ NO ROLE RESTRICTIONS
  async updateTicket(ticketId, updateData, userId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    // Track changes for activity log
    const changes = [];
    if (updateData.ticketStatus && updateData.ticketStatus !== ticket.ticketStatus) {
      changes.push(`Status changed from "${ticket.ticketStatus}" to "${updateData.ticketStatus}"`);
    }
    if (updateData.priority && updateData.priority !== ticket.priority) {
      changes.push(`Priority changed from "${ticket.priority}" to "${updateData.priority}"`);
    }
    if (updateData.ticketOwner && updateData.ticketOwner !== ticket.ticketOwner.toString()) {
      changes.push('Ticket owner changed');
    }
    
    // If status is being set to Resolved or Closed, set resolvedAt
    if (updateData.ticketStatus === 'Resolved' || updateData.ticketStatus === 'Closed') {
      updateData.resolvedAt = new Date();
    }
    
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        ...updateData,
        updatedBy: userId,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Add to activity log
    if (changes.length > 0) {
      updatedTicket.activityLog.push({
        action: 'updated',
        description: changes.join('. '),
        performedBy: userId
      });
      await updatedTicket.save();
    }
    
    return updatedTicket;
  }
  
  // Delete ticket (soft delete) - ✅ NO ROLE RESTRICTIONS
  async deleteTicket(ticketId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    ticket.isActive = false;
    await ticket.save();
    
    return true;
  }
  
  // Hard delete ticket - ✅ NO ROLE RESTRICTIONS
  async hardDeleteTicket(ticketId) {
    const ticket = await Ticket.findByIdAndDelete(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    return true;
  }
  
  // Update ticket status - ✅ NO ROLE RESTRICTIONS
  async updateTicketStatus(ticketId, status, userId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    ticket.ticketStatus = status;
    ticket.updatedBy = userId;
    
    if (status === 'Resolved' || status === 'Closed') {
      ticket.resolvedAt = new Date();
    }
    
    await ticket.save();
    
    ticket.activityLog.push({
      action: 'status_changed',
      description: `Status changed to "${status}"`,
      performedBy: userId
    });
    await ticket.save();
    
    return ticket;
  }
  
  // Assign ticket to user - ✅ NO ROLE RESTRICTIONS
  async assignTicket(ticketId, assignedToUserId, userId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    ticket.ticketOwner = assignedToUserId;
    ticket.updatedBy = userId;
    await ticket.save();
    
    ticket.activityLog.push({
      action: 'assigned',
      description: `Assigned to user ${assignedToUserId}`,
      performedBy: userId
    });
    await ticket.save();
    
    return ticket;
  }
  
  // Add comment to ticket - ✅ NO ROLE RESTRICTIONS
  async addComment(ticketId, comment, userId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    ticket.activityLog.push({
      action: 'commented',
      description: comment,
      performedBy: userId
    });
    await ticket.save();
    
    return ticket;
  }
  
  // Get ticket statistics - ✅ NO ROLE RESTRICTIONS (shows ALL tickets)
  async getTicketStatistics() {
    const statistics = await Ticket.getStatistics();
    
    // Source distribution
    const sourceDistribution = await Ticket.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Priority distribution
    const priorityDistribution = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return {
      ...statistics,
      sourceDistribution,
      priorityDistribution
    };
  }
  
  // Get tickets by deal - ✅ NO ROLE RESTRICTIONS
  async getTicketsByDeal(dealId) {
    const tickets = await Ticket.find({ associatedDeal: dealId, isActive: true })
      .populate('ticketOwner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return tickets;
  }
  
  // Get tickets by company - ✅ NO ROLE RESTRICTIONS
  async getTicketsByCompany(companyId) {
    const tickets = await Ticket.find({ associatedCompany: companyId, isActive: true })
      .populate('ticketOwner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return tickets;
  }
  
  // Bulk delete tickets - ✅ NO ROLE RESTRICTIONS
  async bulkDeleteTickets(ticketIds) {
    const results = {
      success: [],
      failed: []
    };
    
    for (const ticketId of ticketIds) {
      try {
        await this.deleteTicket(ticketId);
        results.success.push(ticketId);
      } catch (error) {
        results.failed.push({ id: ticketId, error: error.message });
      }
    }
    
    return results;
  }
  
  // Upload attachment - ✅ NO ROLE RESTRICTIONS
  async uploadAttachment(ticketId, fileData, userId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    ticket.attachments.push({
      ...fileData,
      uploadedBy: userId,
      uploadedAt: new Date()
    });
    
    await ticket.save();
    
    return ticket.attachments[ticket.attachments.length - 1];
  }
  
  // Delete attachment - ✅ NO ROLE RESTRICTIONS
  async deleteAttachment(ticketId, attachmentId) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }
    
    const attachmentIndex = ticket.attachments.findIndex(
      att => att._id.toString() === attachmentId
    );
    
    if (attachmentIndex === -1) {
      throw new ApiError(404, 'Attachment not found');
    }
    
    ticket.attachments.splice(attachmentIndex, 1);
    await ticket.save();
    
    return true;
  }
}

module.exports = new TicketService();