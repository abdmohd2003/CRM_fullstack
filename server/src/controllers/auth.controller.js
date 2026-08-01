const authService = require('../services/auth.service');
const { successResponse } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);
      successResponse(res, 201, 'User registered successfully', {
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      successResponse(res, 200, 'Login successful', {
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user._id);
      successResponse(res, 200, 'User profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user._id, req.body);
      successResponse(res, 200, 'Profile updated successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user._id, currentPassword, newPassword);
      successResponse(res, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Step 1: Send OTP to user's email
   * POST /api/auth/forgot-password
   */
  async sendResetOTP(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ApiError(400, 'Email is required');
      }
      
      await authService.sendResetOTP(email);
      
      successResponse(
        res,
        200,
        'If an account exists with this email, you will receive an OTP'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Step 2: Verify OTP
   * POST /api/auth/verify-otp
   */
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        throw new ApiError(400, 'Email and OTP are required');
      }
      
      const { resetToken } = await authService.verifyOTP(email, otp);
      
      successResponse(res, 200, 'OTP verified successfully', { resetToken });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Step 3: Reset password with token (after OTP verification)
   * POST /api/auth/reset-password
   */
  async resetPasswordWithToken(req, res, next) {
    try {
      const { resetToken, password, confirmPassword } = req.body;
      
      if (!resetToken) {
        throw new ApiError(400, 'Reset token is required');
      }
      
      if (!password || !confirmPassword) {
        throw new ApiError(400, 'Password and confirm password are required');
      }
      
      if (password !== confirmPassword) {
        throw new ApiError(400, 'Passwords do not match');
      }
      
      if (password.length < 6) {
        throw new ApiError(400, 'Password must be at least 6 characters');
      }
      
      await authService.resetPasswordWithToken(resetToken, password);
      
      successResponse(
        res,
        200,
        'Password reset successfully. You can now login with your new password.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * GET /api/auth/verify-email/:token
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      await authService.verifyEmail(token);
      successResponse(res, 200, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  async resendVerificationEmail(req, res, next) {
    try {
      await authService.resendVerificationEmail(req.user);
      successResponse(res, 200, 'Verification email sent successfully');
    } catch (error) {
      next(error);
    }
  }
}

// Debug log
console.log('\n✅ AuthController initialized successfully');
console.log('Available methods:', Object.keys(new AuthController()).join(', '), '\n');

module.exports = new AuthController();