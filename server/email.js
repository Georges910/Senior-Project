const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetEmail(to, token, email) {
  const resetLink = `${process.env.FRONTEND_URL.replace(/\/$/, '')}/reset-password/${token}`;
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: 'Password Reset',
    html: `<p>You requested a password reset.</p>
           <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
           <p>This link expires in 60 minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Reset email sent to:', to, 'info:', info && info.messageId ? info.messageId : 'sent');
  return info;
}

module.exports = sendResetEmail;
