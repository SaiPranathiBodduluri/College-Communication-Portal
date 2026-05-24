const nodemailer = require('nodemailer');

// Simple email service that works in demo mode
const sendOTPEmail = async (email, otp, userName = 'User') => {
  console.log('\n📧 ===== SENDING OTP EMAIL =====');
  console.log(`📧 To: ${email}`);
  console.log(`👤 User: ${userName}`);
  console.log(`🔑 OTP: ${otp}`);
  
  // Email content
  const subject = 'SCNBCP - Password Reset OTP';
  const emailContent = `
Hello ${userName},

Your password reset OTP for SCNBCP is: ${otp}

This OTP is valid for 10 minutes only.
Please do not share this OTP with anyone.

If you did not request this password reset, please ignore this email.

Best regards,
SCNBCP Team
Vignan University
  `;
  
  console.log('📧 Subject:', subject);
  console.log('📧 Content:');
  console.log(emailContent);
  console.log('📧 ===============================\n');
  
  // Try to send real email if Gmail is configured
  if (process.env.EMAIL_USER && 
      process.env.EMAIL_PASS && 
      process.env.EMAIL_USER.includes('@gmail.com') &&
      process.env.EMAIL_PASS !== 'your_gmail_app_password_here') {
    
    try {
      console.log('🔄 Attempting to send real email via Gmail...');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const mailOptions = {
        from: `"SCNBCP" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: emailContent,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>SCNBCP</h1>
              <p>Smart College Notice Board & Communication Portal</p>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2>Password Reset Request</h2>
              <p>Hello <strong>${userName}</strong>,</p>
              <p>Your password reset OTP is:</p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: #2563eb; color: white; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 5px;">${otp}</span>
              </div>
              <p><strong>This OTP is valid for 10 minutes only.</strong></p>
              <p>If you did not request this, please ignore this email.</p>
              <hr>
              <p style="text-align: center; color: #666;">
                Best regards,<br>
                SCNBCP Team<br>
                Vignan University
              </p>
            </div>
          </div>
        `
      };
      
      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ REAL EMAIL SENT SUCCESSFULLY!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 Email delivered to: ${email}`);
      
      return {
        success: true,
        messageId: result.messageId,
        isDemoMode: false,
        realEmailSent: true
      };
      
    } catch (error) {
      console.log('❌ Gmail sending failed:', error.message);
      console.log('📧 Falling back to demo mode...');
    }
  }
  
  // Demo mode - email content is logged above
  console.log('📧 DEMO MODE: Email content logged above');
  console.log(`✅ OTP ${otp} would be sent to ${email}`);
  
  return {
    success: true,
    messageId: 'demo_' + Date.now(),
    isDemoMode: true,
    otp: otp,
    emailContent: emailContent
  };
};

module.exports = {
  sendOTPEmail
};