// src/services/companyService.js
import axiosInstance from "../api/axiosConfig";

class CompanyService {
  // Create company
  async createCompany(companyData) {
    try {
      const response = await axiosInstance.post('/companies', companyData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Get all companies with filters
  async getCompanies(filters = {}) {
    try {
      // Add timestamp to prevent caching
      const queryParams = new URLSearchParams({
        ...filters,
        _t: Date.now()
      }).toString();
      const url = queryParams ? `/companies?${queryParams}` : '/companies';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Get company by ID
  async getCompanyById(id) {
    try {
      const response = await axiosInstance.get(`/companies/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Update company
  async updateCompany(id, companyData) {
    try {
      const response = await axiosInstance.put(`/companies/${id}`, companyData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Delete company (soft delete)
  async deleteCompany(id) {
    try {
      const response = await axiosInstance.delete(`/companies/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Hard delete company (permanent)
  async hardDeleteCompany(id) {
    try {
      const response = await axiosInstance.delete(`/companies/${id}/permanent`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Get company statistics
  async getCompanyStatistics() {
    try {
      const response = await axiosInstance.get('/companies/statistics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Upload attachment
  async uploadAttachment(companyId, attachmentData) {
    try {
      const response = await axiosInstance.post(`/companies/${companyId}/attachments`, attachmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Delete attachment
  async deleteAttachment(companyId, attachmentId) {
    try {
      const response = await axiosInstance.delete(`/companies/${companyId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Bulk delete companies
  async bulkDeleteCompanies(companyIds) {
    try {
      const response = await axiosInstance.post('/companies/bulk/delete', { companyIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
}

export default new CompanyService();