import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  // Timer for OTP resend
  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  // Step 1: Validate email only
  const validateEmail = () => {
    let newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authService.sendResetOTP(email);
      
      if (response.success) {
        toast.success('OTP sent to your email!');
        setStep(2);
        setTimer(60);
        setCanResend(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const response = await authService.sendResetOTP(email);
      if (response.success) {
        toast.success('New OTP sent to your email');
        setTimer(60);
        setCanResend(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Step 2: Verify OTP
// Step 2: Verify OTP
const handleVerifyOTP = async () => {
  const otpCode = otp.join('');
  
  
  if (otpCode.length !== 6) {
    toast.error('Please enter the complete 6-digit OTP');
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await authService.verifyOTP(email, otpCode);
    
    if (response.success) {
      // Try different ways to get the reset token
      const resetToken = response.data?.resetToken || response.resetToken;
      
      if (!resetToken) {
        console.error('No reset token found in response:', response);
        toast.error('Failed to get reset token. Please try again.');
        return;
      }
      
      sessionStorage.setItem('resetToken', resetToken);
      sessionStorage.setItem('resetEmail', email);
      
      
      toast.success('OTP verified! Please set your new password.');
      setStep(3);
    } else {
      toast.error(response.message);
    }
  } catch (error) {
    console.log('7. Error:', error);
    console.log('7a. Error response:', error.response?.data);
    toast.error(error.message || 'Failed to verify OTP');
  } finally {
    setLoading(false);
  }
};

  // Step 3: Validate password
  const validatePassword = () => {
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

  // Step 3: Reset password
const handleResetPassword = async (e) => {
  e.preventDefault();
  
  const resetToken = sessionStorage.getItem('resetToken');
  
  if (!resetToken) {
    toast.error('Session expired. Please start over.');
    setStep(1);
    return;
  }
  
  if (!validatePassword()) {
    toast.error('Please fix the form errors');
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await authService.resetPasswordWithToken(
      resetToken,
      password,
      confirmPassword
    );
    
    if (response.success) {
      toast.success('Password reset successful! Redirecting to login...');
      sessionStorage.clear();
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      toast.error(response.message);
    }
  } catch (error) {
    console.log('13. Reset error:', error);
    toast.error(error.message || 'Failed to reset password');
  } finally {
    setLoading(false);
  }
};
  // Step 1: Email Form
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-3xl font-bold text-center text-[#1A1A1A] mb-3">
            Forgot Password
          </h2>
          
          <p className="text-sm text-gray-500 text-center mb-8">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-lg outline-none text-sm ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-200 focus:border-[#6366F1]'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A4EE3] hover:bg-[#493ECB] text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-[#6366F1] hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: OTP Verification Form
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-3xl font-bold text-center text-[#1A1A1A] mb-3">
            Verify OTP
          </h2>
          
          <p className="text-sm text-gray-500 text-center mb-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium text-gray-700 text-center mb-8">
            {email}
          </p>

          <div className="space-y-6">
            {/* OTP Input Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter OTP Code
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Resend Section */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-[#6366F1] hover:underline"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in {timer} seconds
                </p>
              )}
            </div>

            {/* Buttons */}
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-[#5A4EE3] hover:bg-[#493ECB] text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              onClick={() => setStep(1)}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: New Password Form
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-3xl font-bold text-center text-[#1A1A1A] mb-3">
          Set New Password
        </h2>
        
        <p className="text-sm text-gray-500 text-center mb-8">
          Please enter your new password for {email}
        </p>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-lg outline-none pr-12 text-sm ${
                  errors.password
                    ? 'border-red-500'
                    : 'border-gray-200 focus:border-[#6366F1]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-lg outline-none pr-12 text-sm ${
                  errors.confirmPassword
                    ? 'border-red-500'
                    : 'border-gray-200 focus:border-[#6366F1]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5A4EE3] hover:bg-[#493ECB] text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
          
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to OTP
          </button>
        </form>
      </div>
    </div>
  );
}