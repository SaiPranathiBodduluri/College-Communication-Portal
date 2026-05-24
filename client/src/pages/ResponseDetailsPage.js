import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import axios from 'axios';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User,
  Clock,
  Download,
  Paperclip,
  Search
} from 'lucide-react';

const ResponseDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDownload = async (filename, originalName) => {
    try {
      const response = await axios.get(`/uploads/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  useEffect(() => {
    fetchNoticeDetails();
  }, [id]);

  const fetchNoticeDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notices/${id}`);
      setNotice(response.data);
      // Filter only comments with attachments (file responses)
      const fileResponses = response.data.comments?.filter(comment => 
        comment.attachments && comment.attachments.length > 0
      ) || [];
      setFilteredResponses(fileResponses);
    } catch (error) {
      console.error('Error fetching notice details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter file responses based on search term
  useEffect(() => {
    if (!notice || !notice.comments) return;
    
    const fileResponses = notice.comments.filter(comment => 
      comment.attachments && comment.attachments.length > 0
    );
    
    if (!searchTerm.trim()) {
      setFilteredResponses(fileResponses);
    } else {
      const filtered = fileResponses.filter(response => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search by user name or ID
        if ((response.name && response.name.toLowerCase().includes(searchLower)) ||
            (response.userId && response.userId.toLowerCase().includes(searchLower)) ||
            (response.user && response.user.toString().toLowerCase().includes(searchLower))) {
          return true;
        }
        
        // Search by file names
        return response.attachments.some(attachment => 
          attachment.originalName.toLowerCase().includes(searchLower)
        );
      });
      setFilteredResponses(filtered);
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

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('text')) return '📃';
    return '📎';
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
            <Link to="/responses" className="text-vignan-blue hover:text-blue-700">
              Back to Responses
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
              to="/responses"
              className="flex items-center text-vignan-blue hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Responses
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
                  {notice.allowFileSubmissions && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      File Submissions Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Responses */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Paperclip className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900 whitespace-nowrap">
                    File Responses ({filteredResponses.length})
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
              {filteredResponses.length > 0 ? (
                <div className="space-y-6">
                  {filteredResponses.map((response, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-full bg-green-100">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="font-medium text-gray-900">
                              {response.userId && response.name ? `${response.userId} - ${response.name}` : response.name || 'Unknown User'}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                              {response.role}
                            </span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(response.createdAt).toLocaleDateString()} at {new Date(response.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          

                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>Submitted Files ({response.attachments.length})</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {response.attachments.map((attachment, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="text-2xl">
                                      {getFileIcon(attachment.mimetype)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {attachment.originalName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {attachment.mimetype}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleDownload(attachment.filename, attachment.originalName)}
                                      className="p-2 text-gray-400 hover:text-vignan-blue transition-colors"
                                      title={`Download ${attachment.originalName}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="mx-auto h-16 w-16 text-gray-400" />
                  {searchTerm ? (
                    <>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No matching results</h3>
                      <p className="mt-2 text-gray-500">
                        No file responses found matching "{searchTerm}". Try a different search term.
                      </p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No file responses yet</h3>
                      <p className="mt-2 text-gray-500">
                        {notice.allowFileSubmissions 
                          ? "Students haven't submitted any files yet." 
                          : "File submissions are not enabled for this notice."
                        }
                      </p>
                    </>
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

export default ResponseDetailsPage;