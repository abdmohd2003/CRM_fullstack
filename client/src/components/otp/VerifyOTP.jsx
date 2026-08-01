import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import authService from '../../services/authService';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
    
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Start timer for resend
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
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    // Take only the last character
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input if value is entered and not last input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    const key = e.key;
    
    // Handle backspace - delete current digit and move to previous
    if (key === 'Backspace') {
      e.preventDefault();
      
      const newOtp = [...otp];
      
      if (newOtp[index] !== '') {
        // If current box has a digit, clear it
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // If current box is empty, move to previous box and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Handle left arrow key
    if (key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle right arrow key
    if (key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numbers = pastedText.replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < numbers.length; i++) {
      newOtp[i] = numbers[i];
    }
    setOtp(newOtp);
    
    // Focus on the next empty input or last filled
    const nextIndex = Math.min(numbers.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      const response = await authService.sendResetOTP(email);
      if (response.success) {
        toast.success('New OTP sent to your email!');
        setTimer(60);
        setCanResend(false);
        
        // Reset timer interval
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
        
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      const newPassword = sessionStorage.getItem('resetPassword');
      const confirmPassword = sessionStorage.getItem('resetConfirmPassword');
      
      if (!newPassword || !confirmPassword) {
        toast.error('Session expired. Please start over.');
        navigate('/forgot-password');
        return;
      }
      
      const response = await authService.verifyOTPAndResetPassword(
        email,
        otpCode,
        newPassword,
        confirmPassword
      );
      
      if (response.success) {
        toast.success('Password reset successful! Redirecting to login...');
        sessionStorage.removeItem('resetPassword');
        sessionStorage.removeItem('resetConfirmPassword');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Verify OTP
        </h2>
        
        <p className="text-sm text-gray-500 text-center mb-1">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-sm font-semibold text-indigo-600 text-center mb-8">
          {email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter 6-Digit OTP
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all duration-200
                    ${digit ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50'}
                    hover:border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100`}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Resend Section */}
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Resend OTP
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Resend code in {timer} seconds
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Verify & Reset Password
              </span>
            )}
          </button>
          
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="w-full text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forgot Password
          </button>
        </form>
      </div>
    </div>
  );
}