// src/services/leadService.js
import axiosInstance from '../api/axiosConfig';

const leadService = {
  getAllLeads: async () => {
    const response = await axiosInstance.get('/leads');
    return response.data; // Expected format: { success: true, count: X, data: [...] }
  },

  getLeadById: async (id) => {
    const response = await axiosInstance.get(`/leads/${id}`);
    return response.data.data;
  },

  createLead: async (leadData) => {
    const response = await axiosInstance.post('/leads', leadData);
    return response.data.data; // Returns fully populated lead document
  },

  updateLead: async (id, leadData) => {
    const response = await axiosInstance.put(`/leads/${id}`, leadData);
    return response.data.data;
  },

  deleteLead: async (id) => {
    const response = await axiosInstance.delete(`/leads/${id}`);
    return response.data;
  },

  bulkImportLeads: async (leads) => {
    try {
      const response = await axiosInstance.post('/leads/bulk-import', { leads });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

export default leadService;