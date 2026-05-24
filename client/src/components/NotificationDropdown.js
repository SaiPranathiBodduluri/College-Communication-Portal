  import { useState, useEffect, useRef } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { Bell, X, MessageCircle, FileText, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
  import axios from '../axiosConfig';
  import { toast } from 'react-toastify';

  const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch notification count
    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get('/api/notifications/count');
        console.log('Notification count response:', response.data);
        setUnreadCount(response.data.total);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    // Fetch recent notifications
    const fetchNotifications = async () => {
      if (loading) return;
      
      setLoading(true);
      try {
        const response = await axios.get('/api/notifications/recent?limit=10');
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
        await axios.post('/api/notifications/mark-read', {
          type: notification.type,
          id: notification.id
        });
        
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Navigate to appropriate page
        if (notification.type === 'message') {
          navigate('/responses');
        } else if (notification.type === 'notice') {
          navigate(`/notices/${notification.id}`);
        }
        
        setIsOpen(false);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        toast.error('Failed to mark notification as read');
      }
    };

    // Mark all as read
    const markAllAsRead = async () => {
      try {
        await axios.post('/api/notifications/mark-all-read');
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        toast.error('Failed to mark all notifications as read');
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Fetch count on component mount and periodically
    useEffect(() => {
      fetchNotificationCount();
      
      // Poll for new notifications every 5 seconds for better real-time updates
      const interval = setInterval(fetchNotificationCount, 5000);
      
      return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
      if (isOpen && notifications.length === 0) {
        fetchNotifications();
      }
    }, [isOpen]);

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

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
        return <MessageCircle size={16} className="text-blue-600" />;
      } else {
        return priority === 'urgent' || priority === 'high' 
          ? <AlertCircle size={16} className="text-red-600" />
          : <FileText size={16} className="text-blue-600" />;
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
      <div className="relative" ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
          onClick={handleToggle}
          className="relative text-gray-600 hover:text-blue-600 transition-colors duration-200"
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            boxShadow: 'none'
          }}
          title="Notifications"
        >
          <Bell size={24} />
          {/* Debug: Always show count for testing */}
          <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium border-2 border-white">
            {unreadCount || '0'}
          </span>
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto notification-dropdown">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={`${notification.type}-${notification.id}`}
                      onClick={() => markAsRead(notification)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority || 'normal'}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {notification.content?.substring(0, 100)}
                            {notification.content?.length > 100 ? '...' : ''}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock size={12} />
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                            </div>
                            
                            {notification.type === 'message' && notification.sender && (
                              <span className="text-xs text-gray-500">
                                from {notification.sender.name}
                              </span>
                            )}
                            
                            {notification.type === 'notice' && notification.author && (
                              <span className="text-xs text-gray-500">
                                by {notification.author.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    navigate('/notices');
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default NotificationDropdown;