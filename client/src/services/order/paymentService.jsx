// services/paymentService.js
import api from '../../api/axiosConfig';

const paymentService = {
  /**
   * Record payment manually (Step 7)
   * @param {Object} data - { orderId, amount, paymentDate, method, reference, transactionId, notes, invoiceId }
   */
  recordPayment: async (data) => {
    try {
      const response = await api.post('/payments/record', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

 /**
 * Get payment by ID
 * @param {string} paymentId 
 */
getPaymentById: async (paymentId) => {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    const response = await api.get(`/payments/${paymentId}`);
    
    // ⭐ Return the data directly if it's already in the right format
    // This handles both { data: {...} } and just {...}
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getPaymentById error:', error);
    throw error.response?.data || error.message;
  }
},

  /**
   * ⭐ NEW: Get all payments with optional filters
   * @param {Object} params - { status, method, orderId, page, limit }
   */
  getPayments: async (params = {}) => {
    try {
      const response = await api.get('/payments', { params });
      return response.data;
    } catch (error) {
      console.error('❌ getPayments error:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all payments for an order
   * @param {string} orderId 
   */
  getOrderPayments: async (orderId) => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Process refund for a payment
   * @param {string} paymentId 
   */
  processRefund: async (paymentId) => {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Generate payment link (Stripe)
   * @param {string} orderId 
   */
  generatePaymentLink: async (orderId) => {
    try {
      const response = await api.post(`/payments/${orderId}/payment-link`);
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



downloadReceipt: async (paymentId) => {
  // 1. Fixed the double "await await" typo
  // 2. Swapped the URL suffix to match your backend route (/receipt)
  return await api.get(`/payments/${paymentId}/receipt`, {
    responseType: 'blob', // Crucial for handling PDF downloads!
  });
}
}






export default paymentService;