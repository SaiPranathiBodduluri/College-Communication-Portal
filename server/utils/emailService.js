const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  // Try Gmail SMTP if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS && 
      process.env.SMTP_USER !== 'your-email@gmail.com' &&
      process.env.SMTP_PASS !== 'your-app-password') {
    
    console.log('📧 Using Gmail SMTP for real email delivery');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Demo mode - log email content
  console.log('📧 Using Demo Mode - Configure SMTP_USER and SMTP_PASS in .env for real emails');
  return null;
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName = 'User') => {
  console.log(`\n📧 ===== SENDING OTP EMAIL =====`);
  console.log(`📧 To: ${email}`);
  console.log(`👤 User: ${userName}`);
  console.log(`🔑 OTP: ${otp}`);
  
  const subject = 'SCNBCP - Password Reset OTP';
  const textContent = `
Hello ${userName},

Your password reset OTP for SCNBCP (Smart College Notice Board & Communication Portal) is: ${otp}

This OTP is valid for 10 minutes only. Please do not share this OTP with anyone.

If you did not request this password reset, please ignore this email.

Best regards,
SCNBCP Team
Vignan University
  `;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">SCNBCP</h1>
        <p style="margin: 5px 0 0 0;">Smart College Notice Board & Communication Portal</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        
        <p>Hello <strong>${userName}</strong>,</p>
        
        <p>Your password reset OTP is:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <div style="background-color: #2563eb; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
            ${otp}
          </div>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Important:</strong> This OTP is valid for <strong>10 minutes only</strong>. Do not share this OTP with anyone.
          </p>
        </div>
        
        <p>If you did not request this password reset, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="text-align: center; color: #666; font-size: 12px;">
          Best regards,<br>
          <strong>SCNBCP Team</strong><br>
          Vignan University
        </p>
      </div>
    </div>
  `;
  
  try {
    const transporter = createTransporter();
    
    if (transporter) {
      // Send real email
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"SCNBCP" <noreply@vignan.ac.in>',
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent
      };
      
      console.log('📤 Sending real email...');
      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ REAL EMAIL SENT SUCCESSFULLY!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 Email delivered to: ${email}`);
      console.log(`📧 ===============================\n`);
      
      return {
        success: true,
        messageId: result.messageId,
        isDemoMode: false
      };
    } else {
      // Demo mode
      console.log('📧 Subject:', subject);
      console.log('📧 Content:', textContent);
      console.log(`📧 ===============================\n`);
      
      return {
        success: true,
        messageId: 'demo_' + Date.now(),
        isDemoMode: true,
        otp: otp
      };
    }
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Fallback to demo mode
    console.log('📧 FALLBACK: Demo Mode');
    console.log(`🔑 OTP: ${otp}`);
    console.log(`📧 ===============================\n`);
    
    return {
      success: true,
      messageId: 'demo_' + Date.now(),
      isDemoMode: true,
      otp: otp
    };
  }
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendOTPEmail,
  generateOTP
};