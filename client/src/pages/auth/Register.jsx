import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { 
  registerStart, 
  registerSuccess, 
  registerFailure 
} from '../../redux/slices/authSlice'; // ✅ Import from authSlice
import authService from '../../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    industryType: '',
    countryOrRegion: '',
    role: '', 
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.industryType) newErrors.industryType = 'Select industry type';
    if (!formData.countryOrRegion.trim()) newErrors.countryOrRegion = 'Country or region is required';
    if (!formData.role) newErrors.role = 'Select a role';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
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

    setLoading(true);
    dispatch(registerStart());

    try {
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        companyName: formData.companyName || 'Not specified',
        industryType: formData.industryType,
        countryOrRegion: formData.countryOrRegion,
        role: formData.role
      };

      const response = await authService.register(registerData);

      if (response.success) {
        dispatch(registerSuccess({
          user: response.data.user,
          token: response.data.token
        }));
        
        toast.success(response.message || 'Registration Successful!');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        dispatch(registerFailure(response.message));
        toast.error(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      dispatch(registerFailure(err.message || 'Something went wrong'));
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm w-full max-w-2xl mt-8 mb-8">
        <h2 className="text-3xl font-bold text-center text-[#1A1A1A] mb-8">
          Register
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter your first name"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.firstName
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.lastName
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter your phone number"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.phoneNumber
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.password
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                placeholder="Enter your company name"
                autoComplete="organization"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none transition-all duration-200 text-sm focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Type <span className="text-red-500">*</span>
              </label>
              <select
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 bg-white text-sm appearance-none
                ${
                  errors.industryType
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              >
                <option value="">Choose</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
              {errors.industryType && <p className="text-red-500 text-sm mt-1">{errors.industryType}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country or Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="countryOrRegion"
                placeholder="Enter your country or region"
                autoComplete="country-name"
                value={formData.countryOrRegion}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-sm
                ${
                  errors.countryOrRegion
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              />
              {errors.countryOrRegion && <p className="text-red-500 text-sm mt-1">{errors.countryOrRegion}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 bg-white text-sm appearance-none
                ${
                  errors.role
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-100 hover:border-gray-300'
                }`}
              >
                <option value="">Select role</option>
                <option value="Sales">Sales</option>
              </select>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-12 bg-[#5A4EE3] hover:bg-[#493ECB] text-white text-sm font-medium py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-sm text-gray-600 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#6366F1] hover:underline font-medium">
          Login
        </Link>
      </p>
    </div>
  );
}