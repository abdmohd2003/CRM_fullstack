// src/services/resend.service.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

class ResendEmailService {
  async sendPasswordResetOTP(email, otp, userName) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'CRM <onboarding@resend.dev>', // Resend's testing domain
        to: [email],
        subject: 'Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Password Reset OTP</h2>
            <p>Hello ${userName},</p>
            <p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
          </div>
        `
      });
      
      if (error) throw error;
      console.log(`✅ OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Resend error:', error);
      return false;
    }
  }
}

module.exports = new ResendEmailService();