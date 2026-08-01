// src/services/productService.js
import axiosInstance from '../api/axiosConfig';

const productService = {
  getAllProducts: async () => {
    try {
      const response = await axiosInstance.get('/products');
      return response.data; 
    } catch (error) {
      console.error("Axios product fetch failed:", error);
      throw error;
    }
  }
};

export default productService;