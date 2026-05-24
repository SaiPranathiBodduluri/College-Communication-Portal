import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import { Upload, Trash2, Download, Users, UserCheck, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const DataManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [count, setCount] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Admin can only manage their own department
  const selectedDept = user?.dept || 'CSE';
  
  // Debug: Log user department
  useEffect(() => {
    console.log('Current user:', user);
    console.log('User department:', selectedDept);
  }, [user, selectedDept]);

  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch count when tab changes
  useEffect(() => {
    if (selectedDept) {
      fetchCount();
    }
  }, [activeTab, selectedDept]);

  const fetchCount = async () => {
    try {
      console.log('Fetching count for:', activeTab, selectedDept);
      const response = await axios.get(`/api/data-management/${activeTab}/count/${selectedDept}`);
      console.log('Count response:', response.data);
      setCount(response.data.count);
    } catch (error) {
      console.error('Error fetching count:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Error fetching count');
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`/api/data-management/${activeTab}/${selectedDept}`);
      toast.success(response.data.message);
      setShowDeleteConfirm(false);
      fetchCount();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', selectedDept);

    try {
      const response = await axios.post(`/api/data-management/${activeTab}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Clear file after successful upload
      setFile(null);
      const fileInput = document.getElementById('file-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Show success modal instead of toast
      setShowUploadSuccess(true);
      
      fetchCount();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error uploading file');
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
      }
      
      // Also clear file on error to allow retry
      setFile(null);
      const fileInput = document.getElementById('file-input');
      if (fileInput) {
        fileInput.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    if (!selectedDept) {
      toast.error('Department not found');
      return;
    }
    
    let csvContent = '';
    
    if (activeTab === 'students') {
      csvContent = 'name,id,password,email,phoneNumber,dept,year,section,specialRole\n';
      csvContent += `John Doe,231FA04001,Student@123,john@college.edu,9876543210,${selectedDept},2,A,none\n`;
      csvContent += `Jane Smith,231FA04002,Student@123,jane@college.edu,9876543211,${selectedDept},2,B,CR\n`;
    } else if (activeTab === 'faculty') {
      csvContent = 'facultyId,name,email,phoneNumber,homeDept,password,accessDept,accessYear,accessSections\n';
      csvContent += `FAC001,Dr. Ramesh Kumar,ramesh@college.edu,9876543210,${selectedDept},Faculty@123,${selectedDept},2,"A,B"\n`;
      csvContent += `FAC001,Dr. Ramesh Kumar,ramesh@college.edu,9876543210,${selectedDept},Faculty@123,${selectedDept},3,A\n`;
      csvContent += `FAC001,Dr. Ramesh Kumar,ramesh@college.edu,9876543210,${selectedDept},Faculty@123,ECE,2,C\n`;
      csvContent += `FAC002,Dr. Priya Sharma,priya@college.edu,9876543211,${selectedDept},Faculty@123,${selectedDept},1,"A,B,C"\n`;
    } else if (activeTab === 'admins') {
      csvContent = 'adminId,name,email,phoneNumber,homeDept,password,accessDept,accessYear,accessSections\n';
      csvContent += `ADM001,Admin Kumar,admin1@college.edu,9876543210,${selectedDept},Admin@123,${selectedDept},2,"A,B"\n`;
      csvContent += `ADM001,Admin Kumar,admin1@college.edu,9876543210,${selectedDept},Admin@123,${selectedDept},3,A\n`;
      csvContent += `ADM002,Admin Priya,admin2@college.edu,9876543211,${selectedDept},Admin@123,${selectedDept},1,"A,B,C"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${activeTab}_${selectedDept}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTabIcon = (tab) => {
    switch(tab) {
      case 'students': return <Users size={20} />;
      case 'faculty': return <UserCheck size={20} />;
      case 'admins': return <Shield size={20} />;
      default: return null;
    }
  };

  const getTabLabel = (tab) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  // Upload Success Modal Component
  const UploadSuccessModal = () => (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowUploadSuccess(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        style={{ 
          zIndex: 1000000,
          transform: 'translateY(0)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="bg-green-100 p-3 rounded-full mx-auto mb-4 w-fit">
            <Upload className="text-green-600" size={24} />
          </div>
          
          <p className="text-lg font-semibold text-gray-900 mb-6">
            Data Added Successfully
          </p>
          
          <button
            onClick={() => setShowUploadSuccess(false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  // Delete Confirm Modal Component
  const DeleteConfirmModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowDeleteConfirm(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        style={{ zIndex: 1000000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete all <strong>{count} {activeTab}</strong> from <strong>{selectedDept}</strong> department? 
          This action cannot be undone.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: loading ? '#9CA3AF' : '#DC2626',
              color: '#FFFFFF',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#DC2626';
            }}
          >
            {loading ? 'Deleting...' : 'Yes, Delete All'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: loading ? '#F3F4F6' : '#E5E7EB',
              color: '#1F2937',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#E5E7EB';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage students and faculty for {selectedDept} department</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:space-x-2 sm:gap-0 border-b border-gray-200 mb-6">
            {['students', 'faculty', 'admins'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-200 border-b-2 text-sm sm:text-base ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {getTabIcon(tab)}
                <span>{getTabLabel(tab)}</span>
              </button>
            ))}
          </div>

          {/* Department and Count - Single Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Your Department</p>
              <p className="text-2xl font-bold text-gray-900">{selectedDept}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Current {getTabLabel(activeTab)}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          </div>

          {/* Delete Section */}
          <div className="border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3 mb-3">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Delete All {selectedDept} {getTabLabel(activeTab)}</h3>
                <p className="text-sm text-gray-600">
                  This will permanently delete all {count} {activeTab}. This action cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || count === 0}
              className="w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center sm:justify-start space-x-2 transition-all duration-200 font-medium text-sm sm:text-base border-0 outline-none focus:outline-none"
              style={{
                backgroundColor: (loading || count === 0) ? '#9CA3AF' : '#DC2626',
                color: '#FFFFFF',
                cursor: (loading || count === 0) ? 'not-allowed' : 'pointer',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading && count > 0) {
                  e.target.style.backgroundColor = '#B91C1C';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && count > 0) {
                  e.target.style.backgroundColor = '#DC2626';
                }
              }}
            >
              <Trash2 size={18} />
              <span>Delete All</span>
            </button>
          </div>

          {/* Upload Section */}
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Upload New {getTabLabel(activeTab)}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose CSV File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">CSV Format Required:</p>
              <code className="text-xs text-gray-600 block bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {activeTab === 'students' && 'name,id,password,email,phoneNumber,dept,year,section,specialRole'}
                {activeTab === 'faculty' && 'facultyId,name,email,phoneNumber,homeDept,password,accessDept,accessYear,accessSections'}
                {activeTab === 'admins' && 'adminId,name,email,phoneNumber,homeDept,password,accessDept,accessYear,accessSections'}
              </code>
              {(activeTab === 'faculty' || activeTab === 'admins') && (
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Note:</strong> Same {activeTab === 'faculty' ? 'facultyId' : 'adminId'} can appear multiple times (one row per class assignment).
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-medium border-0 outline-none focus:outline-none"
                style={{
                  backgroundColor: (loading || !file) ? '#9CA3AF' : '#2563EB',
                  color: '#FFFFFF',
                  cursor: (loading || !file) ? 'not-allowed' : 'pointer',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!loading && file) {
                    e.target.style.backgroundColor = '#1D4ED8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && file) {
                    e.target.style.backgroundColor = '#2563EB';
                  }
                }}
              >
                <Upload size={18} />
                <span>{loading ? 'Uploading...' : 'Upload & Add'}</span>
              </button>
              
              <button
                onClick={downloadSampleCSV}
                className="px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-medium border-0 outline-none focus:outline-none"
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1D4ED8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#2563EB';
                }}
              >
                <Download size={18} />
                <span>Download Sample</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render modals using portal to escape DOM hierarchy */}
      {showDeleteConfirm && createPortal(<DeleteConfirmModal />, document.body)}
      {showUploadSuccess && createPortal(<UploadSuccessModal />, document.body)}
    </div>
  );
};

export default DataManagementPage;