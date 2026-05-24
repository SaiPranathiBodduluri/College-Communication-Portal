const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { generateNumericOTP, hashOTP, verifyHashedOTP } = require('../utils/otp');
const { sendOtpEmail } = require('../services/email-smtp');
const { auth } = require('../middleware/auth');

const OTP_TTL = parseInt(process.env.OTP_TTL_SECONDS || '300');
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

router.post('/request-otp', async (req, res) => {
  try {
    const { email, purpose = 'login', role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!role) return res.status(400).json({ error: 'Role required' });

    let user;
    if (role === 'student') {
      user = await Student.findOne({ email });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Optional: rate-limit/ cooldown here (not implemented fully)
    const otp = generateNumericOTP(6);
    const hash = await hashOTP(otp);

    user.otp = {
      hash,
      expiresAt: new Date(Date.now() + OTP_TTL * 1000),
      attempts: 0,
      purpose
    };
    await user.save();

    await sendOtpEmail(email, otp);
    return res.json({ status: 'ok', message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'login', role } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    if (!role) return res.status(400).json({ error: 'Role required' });

    let user;
    if (role === 'student') {
      user = await Student.findOne({ email });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    }

    if (!user || !user.otp || user.otp.purpose !== purpose) return res.status(400).json({ error: 'No OTP requested' });

    if (new Date() > user.otp.expiresAt) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (user.otp.attempts >= MAX_ATTEMPTS) {
      user.otp = undefined;
      await user.save();
      return res.status(429).json({ error: 'Too many attempts' });
    }

    const ok = await verifyHashedOTP(otp, user.otp.hash);
    if (!ok) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Success: clear OTP and proceed (issue JWT or mark email verified)
    user.otp = undefined;
    await user.save();

    // example: create session / JWT here if needed
    return res.json({ status: 'ok', message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { loginId, password, role } = req.body;

    if (!loginId || !password || !role) {
      return res.status(400).json({ message: 'Login ID, password, and role are required' });
    }

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const upperLoginId = loginId.toUpperCase();

    // Check if user exists in the selected role
    let user;
    if (role === 'student') {
      user = await Student.findOne({ id: upperLoginId });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ id: upperLoginId });
    } else if (role === 'admin') {
      user = await Admin.findOne({ id: upperLoginId });
    }

    // If user not found in selected role, check if they exist in other roles
    if (!user) {
      let existsInOtherRole = false;
      
      if (role !== 'student') {
        const studentExists = await Student.findOne({ id: upperLoginId });
        if (studentExists) existsInOtherRole = true;
      }
      
      if (role !== 'faculty' && !existsInOtherRole) {
        const facultyExists = await Faculty.findOne({ id: upperLoginId });
        if (facultyExists) existsInOtherRole = true;
      }
      
      if (role !== 'admin' && !existsInOtherRole) {
        const adminExists = await Admin.findOne({ id: upperLoginId });
        if (adminExists) existsInOtherRole = true;
      }

      if (existsInOtherRole) {
        return res.status(401).json({ message: 'Please choose your correct role' });
      } else {
        return res.status(401).json({ message: 'Please recheck your credentials' });
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Please recheck your credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: role,
      id: user.id,
      dept: user.dept,
      year: user.year,
      section: user.section,
      specialRole: user.specialRole
    };

    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    let user;
    if (req.user.role === 'student') {
      user = await Student.findById(req.user._id).select('-password');
    } else if (req.user.role === 'faculty') {
      user = await Faculty.findById(req.user._id).select('-password');
    } else if (req.user.role === 'admin') {
      user = await Admin.findById(req.user._id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: { ...user.toObject(), role: req.user.role } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password - Send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { loginId, role } = req.body;

    if (!loginId || !role) {
      return res.status(400).json({ message: 'ID and role are required' });
    }

    let user;
    // Find user based on role
    if (role === 'student') {
      user = await Student.findOne({ id: loginId.toUpperCase() });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ id: loginId.toUpperCase() });
    } else if (role === 'admin') {
      user = await Admin.findOne({ id: loginId.toUpperCase() });
    }

    if (!user) {
      return res.status(404).json({ message: 'No account found with this ID' });
    }

    // Generate 6-digit OTP
    const otp = generateNumericOTP(6);
    
    // Store hashed OTP in database
    user.resetOTP = await hashOTP(otp);
    user.resetOTPExpires = new Date(Date.now() + OTP_TTL * 1000);
    await user.save();

    // Send OTP via email
    await sendOtpEmail(user.email, otp);

    // Mask email for response
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1****$3');

    res.json({
      message: 'OTP sent to your registered email address',
      email: maskedEmail
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// Verify OTP for password reset
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { loginId, otp, role } = req.body;

    if (!loginId || !otp || !role) {
      return res.status(400).json({ message: 'Login ID, OTP, and role are required' });
    }

    let user;
    if (role === 'student') {
      user = await Student.findOne({ id: loginId.toUpperCase() });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ id: loginId.toUpperCase() });
    } else if (role === 'admin') {
      user = await Admin.findOne({ id: loginId.toUpperCase() });
    }

    if (!user || !user.resetOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP is expired
    if (new Date() > user.resetOTPExpires) {
      user.resetOTP = undefined;
      user.resetOTPExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    const isValid = await verifyHashedOTP(otp, user.resetOTP);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { loginId, otp, newPassword, role } = req.body;

    if (!loginId || !otp || !newPassword || !role) {
      return res.status(400).json({ message: 'Login ID, OTP, new password, and role are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let user;
    if (role === 'student') {
      user = await Student.findOne({ id: loginId.toUpperCase() });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ id: loginId.toUpperCase() });
    } else if (role === 'admin') {
      user = await Admin.findOne({ id: loginId.toUpperCase() });
    }

    if (!user || !user.resetOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP is expired
    if (new Date() > user.resetOTPExpires) {
      user.resetOTP = undefined;
      user.resetOTPExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    const isValid = await verifyHashedOTP(otp, user.resetOTP);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
