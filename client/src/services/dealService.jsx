// src/services/dealService.js
import axios from 'axios';
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://crm-software-yh77.onrender.com/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});
// Request Interceptor: Attach Auth Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class DealService {
  
  /**
   * Create a new deal
   * @param {Object} dealData - Deal data
   * @returns {Promise} Created deal
   */
  async createDeal(dealData) {
    try {
      const response = await axiosInstance.post('/deals', dealData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Get all deals with filters and lead information
   * @param {Object} filters - Filter criteria
   * @returns {Promise} Deals data array or object
   */
  async getDeals(filters = {}) {
    try {
      // Add populate parameter directly inside parameters option to fetch lead details properly
      const response = await axiosInstance.get('/deals', {
        params: {
          ...filters,
          populate: 'associatedLead' 
        }
      });
      
      // Defensive fallback if your component expects structural pagination info
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: {
            deals: response.data,
            pagination: {
              total: response.data.length,
              page: 1,
              limit: response.data.length,
              totalPages: 1
            }
          }
        };
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Get deal by ID with order information
   * @param {string} id - Deal ID
   * @returns {Promise} Deal with order details
   */
  async getDealById(id) {
    try {
      const response = await axiosInstance.get(`/deals/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Update deal
   * @param {string} id - Deal ID
   * @param {Object} dealData - Updated deal data
   * @returns {Promise} Updated deal
   */
  async updateDeal(id, dealData) {
    try {
      const response = await axiosInstance.put(`/deals/${id}`, dealData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Delete deal
   * @param {string} id - Deal ID
   * @returns {Promise} Deletion confirmation
   */
  async deleteDeal(id) {
    try {
      const response = await axiosInstance.delete(`/deals/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Update deal stage (triggers order creation on CLOSED_WON)
   * @param {string} id - Deal ID
   * @param {string} stage - New stage
   * @returns {Promise} Updated deal
   */
  async updateDealStage(id, stage) {
    try {
      const response = await axiosInstance.patch(`/deals/${id}/stage`, { stage });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Get deal with full order details
   * @param {string} id - Deal ID
   * @returns {Promise} Deal with order, payments, invoice
   */
  async getDealWithOrder(id) {
    try {
      const response = await axiosInstance.get(`/deals/${id}?include=order,payments,invoice`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  /**
   * Get deal by order ID
   * @param {string} orderId - Order ID
   * @returns {Promise} Deal associated with order
   */
  async getDealByOrderId(orderId) {
    try {
      const response = await axiosInstance.get(`/deals/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
}

export default new DealService();