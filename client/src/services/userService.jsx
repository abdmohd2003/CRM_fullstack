// src/services/userService.js
import axiosInstance from "../api/axiosConfig";

class UserService {
  // GET /api/users -> returns a flat array of active users: [{ _id, firstName, lastName, email }]
  async getAllUsers() {
    try {
      const response = await axiosInstance.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
}

export default new UserService();