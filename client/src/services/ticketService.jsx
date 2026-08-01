// src/services/ticketService.js
import axiosInstance from "../api/axiosConfig";

class TicketService {
 async createTicket(ticketData) {
  try {
    const response = await axiosInstance.post('/tickets', ticketData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Network error' };
  }
}

  async getTickets(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/tickets?${queryParams}` : '/tickets';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  async getTicketById(id) {
    try {
      const response = await axiosInstance.get(`/tickets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  async updateTicket(id, ticketData) {
  try {
    const response = await axiosInstance.put(`/tickets/${id}`, ticketData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Network error' };
  }
}

  async deleteTicket(id) {
    try {
      const response = await axiosInstance.delete(`/tickets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  async updateTicketStatus(id, status) {
    try {
      const response = await axiosInstance.patch(`/tickets/${id}/status`, { ticketStatus: status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  async assignTicket(id, assignedTo) {
    try {
      const response = await axiosInstance.patch(`/tickets/${id}/assign`, { assignedTo });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  async addComment(id, comment) {
    try {
      const response = await axiosInstance.post(`/tickets/${id}/comments`, { comment });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
}

export default new TicketService();