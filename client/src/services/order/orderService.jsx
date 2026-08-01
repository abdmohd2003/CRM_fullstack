// services/orderService.js
import api from '../../api/axiosConfig';

const orderService = {
  /**
   * Get all orders with optional filters
   * @param {Object} params - { status, search, page, limit }
   */
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('❌ getOrders error:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get order by ID with full details
   * @param {string} orderId 
   */
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('❌ getOrderById error:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update order details
   * @param {string} orderId 
   * @param {Object} data 
   */
  updateOrder: async (orderId, data) => {
    try {
      const response = await api.patch(`/orders/${orderId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * ⭐ NEW: Update order email only
   * @param {string} orderId 
   * @param {string} email 
   */
  updateOrderEmail: async (orderId, email) => {
    try {
      const response = await api.patch(`/orders/${orderId}/email`, { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Confirm order (Step 3)
   * @param {string} orderId 
   * @param {boolean} sendEmail 
   */
  confirmOrder: async (orderId, sendEmail = false) => {
    try {
      const response = await api.patch(`/orders/${orderId}/confirm`, { sendEmail });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * ⭐ Mark order as completed/delivered
   * @param {string} orderId 
   * @param {string|null} completedAt 
   */
  markOrderCompleted: async (orderId, completedAt = null) => {
    try {
      const payload = { 
        completedAt: completedAt || new Date().toISOString() 
      };
      const response = await api.patch(`/orders/${orderId}/complete`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Cancel order
   * @param {string} orderId 
   */
  cancelOrder: async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get payments for an order
   * @param {string} orderId 
   */
  getOrderPayments: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/payments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get payment summary for an order
   * @param {string} orderId 
   */
  getPaymentSummary: async (orderId) => {
    try {
      const response = await api.get(`/payments/order/${orderId}/summary`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete order
   * @param {string} orderId 
   */
  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default orderService;