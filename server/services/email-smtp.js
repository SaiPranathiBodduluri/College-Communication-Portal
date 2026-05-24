const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // e.g. "smtp.gmail.com" or your SMTP host
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendOtpEmail(to, otp) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'SCNBCP Vignan - Your OTP Code',
    text: `Your OTP is ${otp}. It expires in ${process.env.OTP_TTL_SECONDS/60} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1e40af; margin-bottom: 20px;">SCNBCP Vignan University</h2>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Your One-Time Password (OTP) for password reset:</p>
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1e40af; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">This OTP will expire in <strong>${process.env.OTP_TTL_SECONDS/60} minutes</strong>.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">SCNBCP - Smart College Notice Board Communication Platform</p>
        </div>
      </div>
    `
  });
  console.log(`✅ OTP Email sent to ${to}`);
  return info;
}

module.exports = { sendOtpEmail };
