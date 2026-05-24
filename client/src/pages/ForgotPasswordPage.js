import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    loginId: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/forgot-password', { loginId: formData.loginId });
      
      toast.success('OTP sent to your registered email address!');
      setMaskedEmail(response.data.email);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/auth/verify-reset-otp', {
        loginId: formData.loginId,
        otp: formData.otp
      });
      toast.success('OTP verified successfully!');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password', {
        loginId: formData.loginId,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-vignan-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">V</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vignan University - SCNBCP
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="text-center mb-6">
                <Mail className="mx-auto h-12 w-12 text-vignan-blue" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Reset Your Password
                </h3>
                <p className="text-sm text-gray-600">
                  Enter your Student ID or Employee ID to receive OTP via email
                </p>
              </div>

              <div>
                <label htmlFor="loginId" className="block text-sm font-medium text-gray-700">
                  Student ID / Employee ID
                </label>
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Enter your Student ID or Employee ID"
                  value={formData.loginId}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 231FA04017
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-900">
                  Enter OTP
                </h3>
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit OTP to {maskedEmail}
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength="6"
                  className="input-field mt-1 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  OTP is valid for 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full btn-secondary"
              >
                Resend OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Set New Password
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a strong password for your account
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="input-field mt-1"
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-field mt-1"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="text-green-600">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Password Reset Successful!
              </h3>
              <p className="text-sm text-gray-600">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <Link
                to="/"
                className="w-full btn-primary text-center block"
              >
                Go to Home
              </Link>
            </div>
          )}

          {step < 4 && (
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-vignan-blue hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;