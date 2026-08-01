// services/notificationService.js
import api from '../../api/axiosConfig';

const notificationService = {
  /**
   * Get all notifications for current user
   * @param {Object} params - { page, limit, read, type }
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get notification by ID
   * @param {string} notificationId 
   */
  getNotificationById: async (notificationId) => {
    try {
      const response = await api.get(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId 
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId 
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Clear all read notifications
   */
  clearReadNotifications: async () => {
    try {
      const response = await api.delete('/notifications/clear-read');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete all notifications (admin only)
   */
  deleteAllNotifications: async () => {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get notification types for filtering
   */
  getNotificationTypes: async () => {
    try {
      const response = await api.get('/notifications/types');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default notificationService;