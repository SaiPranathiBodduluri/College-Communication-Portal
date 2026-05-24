import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Filter, Plus, Calendar, User, Eye, Trash2, EyeOff } from 'lucide-react';

const NoticesPage = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1
  });
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'academic', label: 'Academic' },
    { value: 'event', label: 'Events' },
    { value: 'exam', label: 'Exams' },
    { value: 'placement', label: 'Placements' },
    { value: 'circular', label: 'Circulars' },
    { value: 'general', label: 'General' }
  ];

  useEffect(() => {
    fetchNotices();
  }, [filters]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', '10');

      const response = await axios.get(`/api/notices?${params}`);
      setNotices(response.data.notices);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
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

  const canDeleteNotice = (notice) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'faculty' && notice.author?.id === user._id) return true;
    if (user?.role === 'student' && ['CR', 'LR'].includes(user.specialRole)) return true;
    return false;
  };

  const canHideNotice = () => {
    return user?.role === 'student'; // All students can hide notices from their view
  };

  const handleDeleteNotice = async (noticeId, noticeTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${noticeTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/notices/${noticeId}`);
      toast.success('Notice deleted successfully');
      fetchNotices(); // Refresh the list
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error(error.response?.data?.message || 'Failed to delete notice');
    }
  };

  const handleHideNotice = async (noticeId, noticeTitle) => {
    if (!window.confirm(`Hide "${noticeTitle}" from your view? You can restore it later if needed.`)) {
      return;
    }

    try {
      console.log('Hiding notice:', noticeId);
      const response = await axios.post(`/api/notices/${noticeId}/hide`);
      console.log('Hide response:', response.data);
      toast.success('Notice hidden from your view');
      fetchNotices(); // Refresh the list
    } catch (error) {
      console.error('❌ Error hiding notice:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to hide notice';
      toast.error(errorMsg);
      alert(`Error: ${errorMsg}`); // Also show alert for debugging
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">

            {(user?.role === 'admin' || user?.role === 'faculty') && (
              <Link
                to="/notices/create"
                className="bg-vignan-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Notice</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Notices
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by title or content..."
                    className="input-field pl-10"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    className="input-field pl-10"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ category: '', search: '', page: 1 })}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notices List */}
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vignan-blue"></div>
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-6">
              {notices.map((notice) => (
                <div key={notice._id} className="card hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-3xl">{getCategoryIcon(notice.category)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <Link
                              to={`/notices/${notice._id}`}
                              className="text-xl font-semibold text-gray-900 hover:text-vignan-blue"
                            >
                              {notice.title}
                            </Link>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notice.priority)}`}>
                              {notice.priority}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {notice.content}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User size={16} />
                              <span>{notice.author?.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar size={16} />
                              <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye size={16} />
                              <span>{notice.views?.length || 0} views</span>
                            </div>
                            <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                              {notice.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/notices/${notice._id}`}
                          className="btn-primary"
                        >
                          View Details
                        </Link>
                        
                        {canDeleteNotice(notice) && (
                          <button
                            onClick={() => handleDeleteNotice(notice._id, notice.title)}
                            className="btn-secondary text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center space-x-1"
                            title="Delete Notice"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        )}
                        
                        {canHideNotice() && (
                          <button
                            onClick={() => handleHideNotice(notice._id, notice.title)}
                            className="btn-secondary text-gray-600 hover:text-gray-800 hover:bg-gray-50 flex items-center space-x-1"
                            title="Hide from my view"
                          >
                            <EyeOff size={16} />
                            <span>Hide</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.category 
                  ? 'Try adjusting your filters to see more notices.'
                  : 'No notices have been posted yet.'}
              </p>
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <Link
                  to="/notices/create"
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Create First Notice</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      page === filters.page
                        ? 'bg-vignan-blue text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === totalPages}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesPage;