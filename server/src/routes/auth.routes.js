const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  sendResetOTPValidation,
  verifyOTPValidation
} = require('../validators/auth.validator');

// ==================== PUBLIC ROUTES ====================
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

// ==================== OTP-BASED PASSWORD RESET ROUTES ====================
router.post('/forgot-password', sendResetOTPValidation, validate, authController.sendResetOTP);
router.post('/verify-otp', verifyOTPValidation, validate, authController.verifyOTP);
router.post('/reset-password', authController.resetPasswordWithToken);

// ==================== EMAIL VERIFICATION ROUTES ====================
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', protect, authController.resendVerificationEmail);

// ==================== PROTECTED ROUTES ====================
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, updateProfileValidation, validate, authController.updateProfile);
router.put('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

module.exports = router;