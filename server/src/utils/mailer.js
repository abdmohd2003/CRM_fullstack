import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g. "smtp.gmail.com"
  port: process.env.SMTP_PORT,      // e.g. 587
  secure: false,                    // true for port 465, false for others
  auth: {
    user: process.env.SMTP_USER,    // your email address
    pass: process.env.SMTP_PASS,    // app password / SMTP password
  },
});

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your CRM Name" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Email send failed:", err.message);
    throw err;
  }
};

export default transporter;