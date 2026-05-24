import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Clock, User } from 'lucide-react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';


const MessageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch message details
  const fetchMessage = async () => {
    try {
      console.log('MessageDetailPage: Fetching message with ID:', id);
      const response = await axios.get(`/api/messages/${id}`);
      console.log('MessageDetailPage: Message data:', response.data);
      setMessage(response.data);
      
      // Mark message as read
      await axios.post('/api/notifications/mark-read', {
        type: 'message',
        id: id
      });
    } catch (error) {
      console.error('Error fetching message:', error);
      toast.error('Failed to load message');
      navigate('/notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('MessageDetailPage: useEffect called with ID:', id);
    if (id) {
      fetchMessage();
    } else {
      console.error('MessageDetailPage: No ID provided');
      navigate('/notifications');
    }
  }, [id]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading message...</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Message not found</h3>
          <button
            onClick={() => navigate('/notifications')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/notifications')}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <MessageCircle size={24} className="text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Message Details</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Message Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {message.subject}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(message.priority)}`}>
                    {message.priority || 'normal'} priority
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">From</h3>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{message.sender.name}</p>
                <p className="text-sm text-gray-600 capitalize">{message.sender.role}</p>

              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="px-6 py-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Message</h3>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {message.message}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default MessageDetailPage;