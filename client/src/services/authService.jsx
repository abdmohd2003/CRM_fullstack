import axiosInstance from "../api/axiosConfig";

class AuthService {
  // Register user
  async register(userData) {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Login user
async login(email, password) {
  try {
    const response = await axiosInstance.post('/auth/login', { email, password });
    
    if (response.data.success) {
      const token = response.data.data.token;
      const user = response.data.data.user;
      
      
      // ✅ Store token
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error.response?.data || { success: false, message: 'Network error' };
  }
}
  // Step 1: Send OTP to email (matches backend route: /forgot-password)
  async sendResetOTP(email) {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Step 2: Verify OTP (matches backend route: /verify-otp)
  async verifyOTP(email, otp) {
    try {
      const response = await axiosInstance.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Step 3: Reset password with token (matches backend route: /reset-password)
  async resetPasswordWithToken(resetToken, password, confirmPassword) {
    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        resetToken,
        password,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Combined method (if you prefer one call)
  async verifyOTPAndResetPassword(email, otp, newPassword, confirmPassword) {
    try {
      // First verify OTP
      const verifyResponse = await this.verifyOTP(email, otp);
      
      if (!verifyResponse.success) {
        return verifyResponse;
      }
      
      // Then reset password with the token
      const resetToken = verifyResponse.data?.resetToken;
      if (!resetToken) {
        throw new Error('No reset token received');
      }
      
      const resetResponse = await this.resetPasswordWithToken(resetToken, newPassword, confirmPassword);
      return resetResponse;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await axiosInstance.put('/auth/profile', profileData);
      
      if (response.data.success) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...response.data.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword, confirmNewPassword) {
    try {
      const response = await axiosInstance.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Resend verification email
  async resendVerificationEmail() {
    try {
      const response = await axiosInstance.post('/auth/resend-verification');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Get user from storage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export default new AuthService();