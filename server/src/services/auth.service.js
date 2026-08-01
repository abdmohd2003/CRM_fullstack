const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const emailService = require('./email.service');

class AuthService {
  async register(userData) {
    const { password, confirmPassword, ...rest } = userData;
    
    const existingUser = await User.findOne({ email: rest.email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }
    
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      ...rest,
      email: rest.email.toLowerCase(),
      password: hashedPassword
    });
    
    const token = generateToken(user._id, user.email, user.role);
    
    return {
      user: user.toJSON(),
      token
    };
  }
  
  async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }
    
    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }
    
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    const token = generateToken(user._id, user.email, user.role);
    
    return {
      user: user.toJSON(),
      token
    };
  }
  
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user.toJSON();
  }
  
  async updateProfile(userId, updateData) {
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'companyName', 'industryType', 'countryOrRegion'];
    const filteredData = {};
    
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    return user.toJSON();
  }
  
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }
    
    if (newPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }
    
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    return true;
  }
  
  // ============ OTP-BASED PASSWORD RESET METHODS ============

  /**
   * Step 1: Send OTP to user's email
   */
  async sendResetOTP(email) {
    try {
      console.log('\n=== SEND RESET OTP ===');
      console.log('Email:', email);
      
      if (!email) {
        throw new ApiError(400, 'Email is required');
      }
      
      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      // For security, always return success even if user not found
      if (!user) {
        console.log('User not found - returning success for security');
        return true;
      }
      
      // Check if user is active
      if (!user.isActive) {
        throw new ApiError(403, 'Your account has been deactivated');
      }
      
      // Rate limiting - prevent spam (60 seconds cooldown)
      if (user.lastOTPRequest) {
        const timeSinceLastRequest = Date.now() - new Date(user.lastOTPRequest).getTime();
        if (timeSinceLastRequest < 60000) {
          const remainingSeconds = Math.ceil((60000 - timeSinceLastRequest) / 1000);
          throw new ApiError(429, `Please wait ${remainingSeconds} seconds before requesting another OTP`);
        }
      }
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated OTP:', otp);
      
      // Hash OTP for storage
      const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
      
      // Set expiration (10 minutes)
      const otpExpire = new Date(Date.now() + 10 * 60 * 1000);
      
      // Save to database
      user.resetOTP = hashedOTP;
      user.resetOTPExpire = otpExpire;
      user.resetOTPAttempts = 0;
      user.lastOTPRequest = new Date();
      await user.save({ validateBeforeSave: false });
      console.log('OTP saved to database');
      
      // Send email with OTP
      await emailService.sendPasswordResetOTP(
        user.email,
        otp,
        `${user.firstName} ${user.lastName}`
      );
      
      console.log('OTP email sent successfully');
      return true;
      
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }

  /**
   * Step 2: Verify OTP and return reset token
   */
  async verifyOTP(email, otp) {
    try {
      console.log('\n=== VERIFY OTP ===');
      console.log('Email:', email);
      console.log('OTP provided:', otp);
      
      if (!email || !otp) {
        throw new ApiError(400, 'Email and OTP are required');
      }
      
      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      console.log('User found:', user.email);
      console.log('Stored OTP in DB:', user.resetOTP);
      console.log('OTP Expiry in DB:', user.resetOTPExpire);
      
      // Check if OTP exists and not expired
      if (!user.resetOTP || !user.resetOTPExpire) {
        throw new ApiError(400, 'No OTP request found. Please request a new OTP');
      }
      
      // Check if OTP is expired
      if (new Date() > new Date(user.resetOTPExpire)) {
        console.log('OTP expired. Current time:', new Date());
        console.log('OTP expiry time:', user.resetOTPExpire);
        throw new ApiError(400, 'OTP has expired. Please request a new one');
      }
      
      // Check attempt count (max 5 attempts)
      if (user.resetOTPAttempts >= 5) {
        throw new ApiError(400, 'Too many failed attempts. Please request a new OTP');
      }
      
      // Hash the provided OTP for comparison
      const hashedProvidedOTP = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');
      
      console.log('Hashed provided OTP:', hashedProvidedOTP);
      console.log('Stored hashed OTP:', user.resetOTP);
      
      // Verify OTP
      if (user.resetOTP !== hashedProvidedOTP) {
        user.resetOTPAttempts += 1;
        await user.save({ validateBeforeSave: false });
        
        const remainingAttempts = 5 - user.resetOTPAttempts;
        console.log('Invalid OTP. Attempts left:', remainingAttempts);
        throw new ApiError(400, `Invalid OTP. ${remainingAttempts} attempts remaining`);
      }
      
      console.log('✅ OTP verified successfully!');
      
      // OTP is valid - generate temporary reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      console.log('Generated RAW reset token:', resetToken);
      console.log('Generated HASHED reset token:', hashedResetToken);
      
      // Store temporary reset token (valid for 15 minutes)
      user.resetPasswordToken = hashedResetToken;
      user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
      user.resetOTP = null;
      user.resetOTPExpire = null;
      user.resetOTPAttempts = 0;
      await user.save({ validateBeforeSave: false });
      
      console.log('✅ Reset token saved to DB');
      console.log('Token expiry:', user.resetPasswordExpire);
      
      // Verify it was saved correctly
      const savedUser = await User.findOne({ email: email.toLowerCase() });
      console.log('Verification - Token in DB after save:', savedUser.resetPasswordToken);
      console.log('Verification - Token expiry in DB:', savedUser.resetPasswordExpire);
      
      return { resetToken };
      
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  /**
   * Step 3: Reset password using the reset token
   */
  async resetPasswordWithToken(resetToken, newPassword) {
    try {
      console.log('\n=== RESET PASSWORD WITH TOKEN ===');
      console.log('1. Raw reset token received:', resetToken);
      
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      console.log('2. Hashed token for DB search:', hashedToken);
      console.log('3. Current time:', new Date());
      
      // First, let's check ALL users with reset tokens (for debugging)
      const allUsersWithTokens = await User.find({ 
        resetPasswordToken: { $ne: null } 
      }).select('email resetPasswordToken resetPasswordExpire');
      
      console.log('4. All users with reset tokens:', allUsersWithTokens.length);
      allUsersWithTokens.forEach(u => {
        console.log(`   - ${u.email}: token=${u.resetPasswordToken}, expires=${u.resetPasswordExpire}`);
      });
      
      // Now try to find the specific user
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
      
      console.log('5. User found with matching token:', user ? 'YES' : 'NO');
      
      if (!user) {
        // Check if token exists but is expired
        const expiredUser = await User.findOne({
          resetPasswordToken: hashedToken,
          resetPasswordExpire: { $lte: Date.now() }
        });
        
        if (expiredUser) {
          console.log('6. ⚠️ Token found but EXPIRED!');
          console.log('   - User email:', expiredUser.email);
          console.log('   - Token expiry:', expiredUser.resetPasswordExpire);
          console.log('   - Current time:', new Date());
          throw new ApiError(400, 'Reset token has expired. Please request a new OTP.');
        }
        
        console.log('6. ❌ No matching token found in database');
        throw new ApiError(400, 'Invalid or expired reset token');
      }
      
      console.log('7. ✅ Token valid for user:', user.email);
      console.log('   - Token expiry:', user.resetPasswordExpire);
      
      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        throw new ApiError(400, 'Password must be at least 6 characters');
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password and clear all reset fields
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      user.resetOTP = null;
      user.resetOTPExpire = null;
      user.resetOTPAttempts = 0;
      user.lastOTPRequest = null;
      await user.save();
      
      console.log('8. ✅ Password reset successfully for:', user.email);
      return true;
      
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpire: { $gt: Date.now() }
      });
      
      if (!user) {
        throw new ApiError(400, 'Invalid or expired verification token');
      }
      
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpire = null;
      await user.save();
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(user) {
    if (user.isEmailVerified) {
      throw new ApiError(400, 'Email already verified');
    }
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      `${user.firstName} ${user.lastName}`
    );
    
    return true;
  }
}

module.exports = new AuthService();