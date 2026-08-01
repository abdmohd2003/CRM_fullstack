// frontend/src/services/callService.js
import axiosInstance from '../api/axiosConfig';

export const callService = {
  // Initiate a real call
  initiateCall: async (data) => {
    try {
      const response = await axiosInstance.post('/calls/initiate', data);
      return response.data;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  },

  // Log a call manually
  logCall: async (data) => {
    try {
      const response = await axiosInstance.post('/calls/log', data);
      return response.data;
    } catch (error) {
      console.error('Error logging call:', error);
      throw error;
    }
  },

  // Get call history for an entity
  getCallHistory: async (entityType, entityId) => {
    try {
      const response = await axiosInstance.get(`/calls/history/${entityType}/${entityId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting call history:', error);
      throw error;
    }
  },

  // Get call statistics
  getCallStatistics: async (entityType, entityId) => {
    try {
      const response = await axiosInstance.get(`/calls/statistics/${entityType}/${entityId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting call statistics:', error);
      throw error;
    }
  }
};