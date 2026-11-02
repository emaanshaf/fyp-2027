const nodemailer = require('nodemailer');

// Setup Nodemailer transport using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a password reset email
 * @param {string} to - The recipient email
 * @param {string} resetToken - The JWT token for resetting the password
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('\n⚠️ SMTP credentials not configured. Skipping email send.');
    console.warn(`[DEV] Password reset link for ${to}:\nmyapp://reset-password?token=${resetToken}\n`);
    return;
  }

  // The deep link URL that will open the app
  const resetUrl = `myapp://reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Qitab-e-Noor" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset - Qitab-e-Noor',
    text: `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B5E20;">Qitab-e-Noor</h2>
        <p>You requested a password reset. Please click the button below to choose a new password.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #F59E0B; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendPasswordResetEmail,
};
