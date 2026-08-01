import axiosInstance from "../api/axiosConfig";

const activityService = {
  getTimeline: async (entityType, entityId) => {
    try {
      const response = await axiosInstance.get(
        `/activities/timeline/${entityType}/${entityId}`
      );

      return response?.data?.data || [];
    } catch (err) {
      console.error(
        `ERROR FETCHING ${entityType.toUpperCase()} TIMELINE:`,
        err?.response?.data || err.message
      );
      throw err;
    }
  },

  logActivity: async (activityData) => {
    try {

      const response = await axiosInstance.post(
        "/activities",
        activityData
      );

      return response?.data;
    } catch (err) {
      console.error(
        "ERROR LOGGING ACTIVITY:",
        err?.response?.data || err.message
      );
      throw err;
    }
  },

  updateActivity: async (activityId, updateData) => {
    try {
      const response = await axiosInstance.put(
        `/activities/${activityId}`,
        updateData
      );

      return response?.data;
    } catch (err) {
      console.error(
        "ERROR UPDATING ACTIVITY:",
        err?.response?.data || err.message
      );
      throw err;
    }
  },

  deleteActivity: async (activityId) => {
    try {
      const response = await axiosInstance.delete(
        `/activities/${activityId}`
      );

      return response?.data;
    } catch (err) {
      console.error(
        "ERROR DELETING ACTIVITY:",
        err?.response?.data || err.message
      );
      throw err;
    }
  }
};

export default activityService;