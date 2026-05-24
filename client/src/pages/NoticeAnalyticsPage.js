import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import axios from 'axios';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Eye, 
  MessageCircle, 
  Clock,
  Target,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const NoticeAnalyticsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNoticeAnalytics();
  }, [id]);

  const fetchNoticeAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notices/${id}`);
      setNotice(response.data);
    } catch (error) {
      console.error('Error fetching notice analytics:', error);
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

  if (!notice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Notice not found</h1>
            <Link to="/my-created-notices" className="text-vignan-blue hover:text-blue-700">
              Back to My Created Notices
            </Link>
          </div>
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
              to="/my-created-notices"
              className="flex items-center text-vignan-blue hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to My Created Notices
            </Link>
          </div>
          
          {/* Notice Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{getCategoryIcon(notice.category)}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{notice.title}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(notice.priority)}`}>
                    {notice.priority}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{notice.content}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">{notice.category}</span>
                  {notice.allowFileSubmissions && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">File Submissions Allowed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Views */}
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{notice.views?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Category</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{notice.category}</p>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{notice.priority}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <AlertCircle className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {notice.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notice Details */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notice Details</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created On</p>
                    <p className="text-sm text-gray-600">
                      {new Date(notice.createdAt).toLocaleDateString()} at {new Date(notice.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {notice.expiryDate && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Expires On</p>
                      <p className="text-sm text-gray-600">
                        {new Date(notice.expiryDate).toLocaleDateString()} at {new Date(notice.expiryDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">File Submissions</p>
                    <p className="text-sm text-gray-600">
                      {notice.allowFileSubmissions ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Target Audience</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sent To</p>
                    <p className="text-sm text-gray-600">
                      {getTargetAudienceSummary(notice.targetAudience)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Roles</p>
                    <p className="text-sm text-gray-600">
                      {notice.targetAudience?.roles?.join(', ') || 'All'}
                    </p>
                  </div>
                </div>

                {notice.targetAudience?.departments?.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 text-gray-400 mt-0.5">🏢</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Departments</p>
                      <p className="text-sm text-gray-600">
                        {notice.targetAudience.departments.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeAnalyticsPage;