import { useState, useEffect } from 'react';
import { Bell, MessageCircle, FileText, Clock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';


const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch unread notifications (API already filters for unread only)
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/recent?limit=50');
      console.log('Notifications response:', response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notification) => {
    try {
      console.log('Clicking notification:', notification);
      
      await axios.post('/api/notifications/mark-read', {
        type: notification.type,
        id: notification.id
      });
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Navigate to appropriate page
      if (notification.type === 'message') {
        console.log('Navigating to message:', `/messages/${notification.id}`);
        navigate(`/messages/${notification.id}`);
      } else if (notification.type === 'notice') {
        console.log('Navigating to notice:', `/notices/${notification.id}`);
        navigate(`/notices/${notification.id}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };



  useEffect(() => {
    fetchNotifications();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (type === 'message') {
      return <MessageCircle size={20} className="text-blue-600" />;
    } else {
      return priority === 'urgent' || priority === 'high' 
        ? <AlertCircle size={20} className="text-red-600" />
        : <FileText size={20} className="text-blue-600" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <Bell size={24} className="text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">You have no new notifications</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={`${notification.type}-${notification.id}`}
                onClick={() => markAsRead(notification)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {notification.priority || 'normal'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {notification.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock size={12} />
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                      
                      {notification.type === 'message' && notification.sender && (
                        <span>from {notification.sender.name}</span>
                      )}
                      
                      {notification.type === 'notice' && notification.author && (
                        <span>by {notification.author.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;