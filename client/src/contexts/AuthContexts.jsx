import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    if (authService.isAuthenticated()) {
      const storedUser = authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          authService.logout();
        }
      }
    }
    setLoading(false);
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true, data: response.data };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        return { success: true, data: response.data };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true, data: response.data };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    setError(null);
    try {
      const response = await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
      return { success: response.success, message: response.message };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      return { success: response.success, message: response.message };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (token, password, confirmPassword) => {
    setError(null);
    try {
      const response = await authService.resetPassword(token, password, confirmPassword);
      return { success: response.success, message: response.message };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Manager',
    isSales: user?.role === 'Sales'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};