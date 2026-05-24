import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import axios from '../axiosConfig';

const NotificationButton = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      // Get unread messages count directly
      const messagesResponse = await axios.get('/api/messages/recent?limit=50');
      const unreadMessages = messagesResponse.data.filter(msg => !msg.isRead);
      
      // Get notification count from API
      const notificationResponse = await axios.get('/api/notifications/count');
      
      // Use the higher count (messages or API count)
      const messageCount = unreadMessages.length;
      const apiCount = notificationResponse.data.total;
      const totalCount = Math.max(messageCount, apiCount);
      
      console.log('Message count:', messageCount);
      console.log('API count:', apiCount);
      console.log('Using total count:', totalCount);
      
      setUnreadCount(totalCount);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Handle notification button click
  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  // Fetch count on component mount and periodically
  useEffect(() => {
    fetchNotificationCount();
    
    // Poll for new notifications every 5 seconds for better real-time updates
    const interval = setInterval(fetchNotificationCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={handleNotificationClick}
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
      <Bell size={32} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white shadow-lg">
          {unreadCount > 99 ? '99' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationButton;