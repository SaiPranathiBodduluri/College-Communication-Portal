import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Lock, Shield, Building2, CreditCard, CheckCircle, Calendar, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const roleConfig = {
    admin:   { color: 'bg-red-100 text-red-700',   dot: 'bg-red-500'   },
    faculty: { color: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-500'  },
    student: { color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  }[user?.role] || { color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };

  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.newPass || !passwordData.confirm) {
      toast.error('Please fill all fields');
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.newPass,
        role: user?.role
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ current: '', newPass: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-700" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 mb-4">
              <div className="w-24 h-24 rounded-xl bg-blue-600 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors border-0 outline-none focus:outline-none"
                style={{ border: 'none' }}
              >
                <Lock size={15} />
                Change Password
              </button>
            </div>

            {/* Name & Role */}
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${roleConfig.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`}></span>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                <Building2 size={11} />
                {user?.dept}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircle size={11} />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Personal Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <User size={16} className="text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Personal Information</h2>
            </div>
            <div className="space-y-4">
              <InfoRow label="Full Name" value={user?.name} />
              <InfoRow label="ID" value={user?.id} />
              <InfoRow label="Role" value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} />
              <InfoRow label="Department" value={user?.dept} />
              {user?.year && <InfoRow label="Year" value={user?.year} />}
              {user?.section && <InfoRow label="Section" value={user?.section} />}
              {user?.specialRole && user?.specialRole !== 'none' && (
                <InfoRow label="Special Role" value={user?.specialRole} />
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <InfoRow label="Email Address" value={user?.email} />
              <InfoRow label="Phone Number" value={user?.phoneNumber} />
            </div>

            {/* Account Status */}
            <div className="flex items-center gap-2 mt-8 mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Account Status</h2>
            </div>
            <div className="space-y-4">
              <InfoRow label="Status" value="Active" />
              <InfoRow label="Account Type" value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} />
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[10000]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold border-0 outline-none bg-transparent"
                style={{ border: 'none' }}
              >✕</button>
            </div>

            <div className="space-y-4">
              <PasswordInput
                label="Current Password"
                value={passwordData.current}
                show={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
                onChange={v => setPasswordData({ ...passwordData, current: v })}
              />
              <PasswordInput
                label="New Password"
                value={passwordData.newPass}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                onChange={v => setPasswordData({ ...passwordData, newPass: v })}
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwordData.confirm}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                onChange={v => setPasswordData({ ...passwordData, confirm: v })}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors border-0 outline-none"
                style={{ border: 'none' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors border-0 outline-none"
                style={{ border: 'none', backgroundColor: passwordLoading ? '#9CA3AF' : '#2563EB' }}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

function PasswordInput({ label, value, show, onToggle, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 outline-none bg-transparent"
          style={{ border: 'none' }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
