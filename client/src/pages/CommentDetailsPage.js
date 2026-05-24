import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import axios from 'axios';
import { 
  ArrowLeft, 
  MessageCircle, 
  CheckCircle, 
  Calendar, 
  User,
  Clock,
  Search
} from 'lucide-react';

const CommentDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [filteredComments, setFilteredComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNoticeDetails();
  }, [id]);

  const fetchNoticeDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notices/${id}`);
      setNotice(response.data);
      setFilteredComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching notice details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter comments based on search term
  useEffect(() => {
    if (!notice || !notice.comments) return;
    
    if (!searchTerm.trim()) {
      setFilteredComments(notice.comments);
    } else {
      const filtered = notice.comments.filter(comment => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (comment.name && comment.name.toLowerCase().includes(searchLower)) ||
          (comment.userId && comment.userId.toLowerCase().includes(searchLower)) ||
          (comment.content && comment.content.toLowerCase().includes(searchLower)) ||
          (comment.user && comment.user.toString().toLowerCase().includes(searchLower))
        );
      });
      setFilteredComments(filtered);
    }
  }, [searchTerm, notice]);

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
            <Link to="/comments" className="text-vignan-blue hover:text-blue-700">
              Back to Comments
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
              to="/comments"
              className="flex items-center text-vignan-blue hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Comments
            </Link>
          </div>
          
          {/* Notice Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{getCategoryIcon(notice.category)}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{notice.title}</h1>
                <p className="text-gray-600 mb-4">{notice.content}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">{notice.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Only */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900 whitespace-nowrap">
                    Comments ({notice.comments?.length || 0})
                  </h3>
                </div>
                {/* Search Bar */}
                <div className="relative w-64 flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-6">
              {filteredComments && filteredComments.length > 0 ? (
                <div className="space-y-4">
                  {filteredComments.map((comment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {comment.userId && comment.name ? `${comment.userId} - ${comment.name}` : comment.name || 'Unknown User'}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                              {comment.role}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  {searchTerm ? (
                    <>
                      <p className="mt-2 text-gray-500">No comments found matching "{searchTerm}"</p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <p className="mt-2 text-gray-500">No comments yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentDetailsPage;