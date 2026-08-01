import React, { useState, useRef, useEffect } from 'react';

const OTPInput = ({ length = 6, onComplete, onOTPChange }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character (in case of paste)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    if (onOTPChange) onOTPChange(otpValue);

    // Move to next input if value exists
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
      setActiveInput(index + 1);
    }

    // Check if OTP is complete
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace - delete current and move to previous
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newOtp = [...otp];
      
      if (newOtp[index] !== '') {
        // If current box has a digit, delete it
        newOtp[index] = '';
        setOtp(newOtp);
        
        const otpValue = newOtp.join('');
        if (onOTPChange) onOTPChange(otpValue);
        
        // Stay on current box after deleting
        inputRefs.current[index].focus();
        setActiveInput(index);
      } else if (index > 0) {
        // If current box is empty, move to previous box and delete its digit
        newOtp[index - 1] = '';
        setOtp(newOtp);
        
        const otpValue = newOtp.join('');
        if (onOTPChange) onOTPChange(otpValue);
        
        // Move focus to previous box
        inputRefs.current[index - 1].focus();
        setActiveInput(index - 1);
      }
    }
    
    // Handle left arrow key
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
      setActiveInput(index - 1);
    }
    
    // Handle right arrow key
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
      setActiveInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    if (onOTPChange) onOTPChange(otpValue);

    // Focus on next empty input or last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex].focus();
    setActiveInput(nextIndex);

    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  const handleFocus = (index) => {
    setActiveInput(index);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl outline-none transition-all duration-200
            ${digit ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50'}
            ${activeInput === index ? 'border-indigo-500 ring-4 ring-indigo-100' : 'hover:border-gray-300'}
            focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100`}
        />
      ))}
    </div>
  );
};

export default OTPInput;