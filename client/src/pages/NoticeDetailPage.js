import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Calendar, 
  User, 
  Eye, 
  MessageCircle, 
  Download, 
  ArrowLeft,
  CheckCircle,
  Send,
  Upload,
  X
} from 'lucide-react';

const NoticeDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchNotice();
  }, [id]);

  const fetchNotice = async () => {
    try {
      const response = await axios.get(`/api/notices/${id}`);
      setNotice(response.data);
      
      // Check if user has acknowledged this notice
      const hasAcknowledged = response.data.acknowledgments?.some(
        ack => ack.user === user?.id
      );
      setAcknowledged(hasAcknowledged);
    } catch (error) {
      toast.error('Failed to load notice');
      navigate('/notices');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await axios.post(`/api/notices/${id}/acknowledge`);
      setAcknowledged(true);
      toast.success('Notice acknowledged');
      fetchNotice(); // Refresh to get updated acknowledgment count
    } catch (error) {
      toast.error('Failed to acknowledge notice');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && (notice.allowFileSubmissions ? attachments.length === 0 : false)) return;

    setSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append('content', comment.trim());
      
      // Only add attachments if file submissions are allowed
      if (notice.allowFileSubmissions) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      await axios.post(`/api/notices/${id}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setComment('');
      setAttachments([]);
      toast.success('Response submitted successfully');
      fetchNotice(); // Refresh to get updated comments
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmittingComment(false);
    }
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
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Notice not found</h1>
            <button
              onClick={() => navigate('/notices')}
              className="mt-4 btn-primary"
            >
              Back to Notices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button */}
          <button
            onClick={() => navigate('/notices')}
            className="flex items-center text-vignan-blue hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Notices
          </button>

          {/* Notice Header */}
          <div className="card p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{getCategoryIcon(notice.category)}</div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {notice.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <User size={16} />
                      <span>{notice.author?.name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="capitalize">{notice.author?.role}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye size={16} />
                      <span>{notice.views?.length || 0} views</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(notice.priority)}`}>
                  {notice.priority}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                  {notice.category}
                </span>
              </div>
            </div>

            {/* Acknowledge Button */}
            {!acknowledged && (
              <div className="mb-4">
                <button
                  onClick={handleAcknowledge}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>Acknowledge Notice</span>
                </button>
              </div>
            )}

            {acknowledged && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">You have acknowledged this notice</span>
                </div>
              </div>
            )}
          </div>

          {/* Notice Content */}
          <div className="card p-6 mb-6">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {notice.content}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {notice.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">📎</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.mimetype}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/uploads/${attachment.filename}`}
                      download={attachment.originalName}
                      className="flex items-center space-x-1 text-vignan-blue hover:text-blue-700"
                    >
                      <Download size={16} />
                      <span className="text-sm">Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className={`grid ${user?.role === 'student' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 mb-6`}>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-vignan-blue">
                {notice.views?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Views</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {notice.acknowledgments?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Acknowledgments</div>
            </div>
            {/* Comments count - Only visible to notice creator */}
            {user?.id === notice.author?.id && (
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {notice.comments?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
            )}
          </div>

          {/* Comments Section - Only visible to notice creator */}
          {user?.id === notice.author?.id && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageCircle className="mr-2" size={20} />
                Comments ({notice.comments?.length || 0})
              </h3>

              {/* Comments List */}
              <div className="space-y-4">
                {notice.comments && notice.comments.length > 0 ? (
                  notice.comments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-vignan-blue pl-4 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {comment.userId && comment.name ? `${comment.userId} - ${comment.name}` : comment.user?.name || comment.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {comment.role || comment.user?.role}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                      
                      {/* Comment Attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 font-medium">Attachments:</p>
                          {comment.attachments.map((attachment, attachIndex) => (
                            <div key={attachIndex} className="flex items-center space-x-2 text-xs">
                              <span>📎</span>
                              <a
                                href={`/uploads/${attachment.filename}`}
                                download={attachment.originalName}
                                className="text-vignan-blue hover:text-blue-700 underline"
                              >
                                {attachment.originalName}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No comments yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Student Comment Form - Only for students */}
          {user?.role === 'student' && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageCircle className="mr-2" size={20} />
                Submit Response
              </h3>

              <form onSubmit={handleCommentSubmit}>
                <div className="space-y-4">
                  <div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write your response here..."
                      rows={3}
                      className="input-field resize-none w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id="attachments"
                        multiple
                        className="hidden"
                        onChange={notice.allowFileSubmissions ? handleFileChange : undefined}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                        disabled={!notice.allowFileSubmissions}
                      />
                      <label
                        htmlFor="attachments"
                        className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                          notice.allowFileSubmissions
                            ? 'cursor-pointer border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            : 'cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50'
                        }`}
                      >
                        <Upload className="mr-2" size={16} />
                        Attach Files
                      </label>
                      <span className="text-xs text-gray-500">
                        {notice.allowFileSubmissions 
                          ? 'PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, TXT (Max 10MB each)'
                          : 'File submissions are disabled for this notice'
                        }
                      </span>
                    </div>

                    {/* File submission status message */}
                    {!notice.allowFileSubmissions && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          📎 File attachments are not allowed for this notice. You can still submit text responses.
                        </p>
                      </div>
                    )}

                    {/* Selected Files */}
                    {attachments.length > 0 && notice.allowFileSubmissions && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || (!comment.trim() && (notice.allowFileSubmissions ? attachments.length === 0 : false))}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                    >
                      {submittingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send size={16} />
                      )}
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailPage;