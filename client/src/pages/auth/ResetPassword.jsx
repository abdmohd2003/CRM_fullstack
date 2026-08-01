import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [token, setToken] = useState('');

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { token: urlToken } = useParams(); // Get token from URL

  useEffect(() => {
    // Extract token from URL
    if (urlToken) {
      setToken(urlToken);
    } else {
      // Also check query parameter (for different routing patterns)
      const queryParams = new URLSearchParams(window.location.search);
      const queryToken = queryParams.get('token');
      if (queryToken) {
        setToken(queryToken);
      } else {
        setValidToken(false);
        toast.error('Invalid reset link. No token provided.');
      }
    }
  }, [urlToken]);

  const validateForm = () => {
    let newErrors = {};

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      // Call actual backend API
      const response = await authService.resetPassword(token, password, confirmPassword);

      if (response.success) {
        toast.success(response.message || 'Password reset successful! Redirecting to login...');
        
        // Clear form
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
      
      // If token is invalid, mark it
      if (err.message?.includes('Invalid') || err.message?.includes('expired')) {
        setValidToken(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // If token is invalid, show error message
  if (!validToken) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Invalid Reset Link
          </h2>
          
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          
          <Link
            to="/forgot-password"
            className="inline-block w-full bg-[#5A4EE3] hover:bg-[#493ECB] text-white font-medium py-3 rounded-lg transition-all duration-200 text-center"
          >
            Request New Reset Link
          </Link>
          
          <Link
            to="/login"
            className="block w-full mt-3 text-[#6366F1] hover:underline text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex justify-center items-center p-4">

      <div className="bg-white w-full max-w-md p-8 rounded-xl border border-gray-100 shadow-sm">

        <h2 className="text-3xl font-bold text-center text-[#1A1A1A] mb-3">
          Reset Password
        </h2>

        <p className="text-sm text-gray-500 text-center mb-8">
          Create a new password for your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                autoComplete="new-password"
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: '',
                  }));
                }}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 pr-12 text-sm
                ${
                  errors.password
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                disabled={loading}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: '',
                  }));
                }}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 pr-12 text-sm
                ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5A4EE3] hover:bg-[#493ECB] text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Back to{' '}
          <Link
            to="/login"
            className="text-[#6366F1] hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}