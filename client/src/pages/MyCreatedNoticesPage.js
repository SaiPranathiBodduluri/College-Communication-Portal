import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import axios from 'axios';
import { Bell, FileText, ArrowLeft, Calendar, Users, Eye, MessageCircle } from 'lucide-react';

const MyCreatedNoticesPage = () => {
  const { user } = useAuth();
  const [createdNotices, setCreatedNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatedNotices();
  }, []);

  const fetchCreatedNotices = async () => {
    try {
      setLoading(true);
      // Create a new endpoint specifically for created notices
      const response = await axios.get('/api/notices/my-created');
      setCreatedNotices(response.data);
    } catch (error) {
      console.error('Error fetching created notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'academic': return '📚';
      case 'event': return '🎉';
      case 'exam': return '📝';
      case 'placement': return '💼';
      case 'circular': return '📋';
      default: return '📢';
    }
  };

  const getTargetAudienceSummary = (targetAudience) => {
    if (!targetAudience) return 'All';
    
    const roles = targetAudience.roles || [];
    const departments = targetAudience.departments || [];
    const years = targetAudience.years || [];
    const sections = targetAudience.sections || [];
    
    let summary = roles.join(', ');
    
    if (departments.length > 0) {
      summary += ` (${departments.join(', ')}`;
      if (years.length > 0) {
        summary += ` - Year ${years.join(', ')}`;
        if (sections.length > 0) {
          summary += ` - Section ${sections.join(', ')}`;
        }
      }
      summary += ')';
    }
    
    return summary;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vignan-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/dashboard"
              className="flex items-center text-vignan-blue hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-8 w-8 text-vignan-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Created Notices</h1>
                <p className="text-gray-600">
                  Notices created • Total {createdNotices.length} 
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Created Notices List */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            {createdNotices.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {createdNotices.map((notice) => (
                  <div key={notice._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCategoryIcon(notice.category)}</div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{notice.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                            <span className="capitalize">{notice.category}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                              {notice.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/notice-analytics/${notice._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-vignan-blue hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No notices created yet</h3>
                <p className="mt-2 text-gray-500">
                  You haven't created any notices yet. Create your first notice to get started.
                </p>
                <Link
                  to="/notices/create"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-vignan-blue hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Notice
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCreatedNoticesPage;