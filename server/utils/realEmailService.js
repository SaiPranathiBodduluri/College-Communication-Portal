const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Multiple email service configurations
const emailServices = [
  // Service 1: Gmail SMTP (if configured)
  {
    name: 'Gmail',
    createTransporter: () => {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      }
      return null;
    }
  },
  
  // Service 2: Outlook/Hotmail SMTP
  {
    name: 'Outlook',
    createTransporter: () => {
      return nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: 'scnbcpvignan@outlook.com',
          pass: 'SCNBCP2024!'
        }
      });
    }
  },
  
  // Service 3: Generic SMTP
  {
    name: 'SMTP2GO',
    createTransporter: () => {
      return nodemailer.createTransport({
        host: 'mail.smtp2go.com',
        port: 587,
        secure: false,
        auth: {
          user: 'scnbcpvignan',
          pass: 'scnbcp123'
        }
      });
    }
  }
];

// Send email using the first available service
const sendRealEmail = async (to, subject, text, html) => {
  console.log(`📧 Attempting to send email to: ${to}`);
  
  for (const service of emailServices) {
    try {
      console.log(`🔄 Trying ${service.name}...`);
      
      const transporter = service.createTransporter();
      if (!transporter) {
        console.log(`⏭️  ${service.name} not configured, skipping...`);
        continue;
      }
      
      const mailOptions = {
        from: `"SCNBCP Vignan" <noreply@vignan.ac.in>`,
        to: to,
        subject: subject,
        text: text,
        html: html
      };
      
      const result = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully via ${service.name}!`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 Recipient: ${to}`);
      
      return {
        success: true,
        messageId: result.messageId,
        service: service.name
      };
      
    } catch (error) {
      console.log(`❌ ${service.name} failed: ${error.message}`);
      continue;
    }
  }
  
  // If all services fail, log the email content
  console.log('❌ All email services failed. Logging email content:');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 Content:', text);
  
  return {
    success: false,
    error: 'All email services failed',
    fallbackContent: { to, subject, text }
  };
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName = 'User') => {
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
          <div style="background-color: #2563eb; color: white; font-size: 28px; font-weight: bold; padding: 15px; border-radius: 6px; letter-spacing: 3px; display: inline-block;">
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
  
  return await sendRealEmail(email, subject, textContent, htmlContent);
};

module.exports = {
  sendOTPEmail,
  sendRealEmail
};