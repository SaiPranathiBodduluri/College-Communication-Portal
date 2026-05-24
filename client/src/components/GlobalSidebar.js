import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { ChevronRight, ChevronLeft, Database, Plus, User, LogOut, MessageCircle, Users, PlusCircle, Bell, Send, Home } from 'lucide-react';
import axios from 'axios';

// Notification Sidebar Item Component
const NotificationSidebarItem = ({ sidebarExpanded }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isActive = location.pathname === '/notifications';

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
      
      setUnreadCount(totalCount);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Fetch count on component mount and periodically
  useEffect(() => {
    fetchNotificationCount();
    
    // Poll for new notifications every 5 seconds for better real-time updates
    const interval = setInterval(fetchNotificationCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getSidebarItemClasses = (isActive) => {
    const baseClasses = `flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200`;
    const stateClasses = isActive 
      ? 'bg-white text-blue-600' 
      : 'text-white hover:bg-blue-700';
    return `${baseClasses} ${stateClasses}`;
  };

  return (
    <Link
      to="/notifications"
      className={getSidebarItemClasses(isActive)}
      title="Notifications"
    >
      <div className="relative">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white shadow-lg">
            {unreadCount > 99 ? '99' : unreadCount}
          </span>
        )}
      </div>
      {sidebarExpanded && <span className="font-medium">Notifications</span>}
    </Link>
  );
};

const GlobalSidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarExpanded, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Clear all inline styles when location changes
  useEffect(() => {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      link.style.backgroundColor = '';
      link.style.color = '';
    });
  }, [location.pathname]);

  useEffect(() => {
    fetchStats(); // Always fetch stats since sidebar is always visible
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Helper function for consistent sidebar item styling
  const getSidebarItemClasses = (isActive) => {
    const baseClasses = `flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200`;
    const stateClasses = isActive 
      ? 'bg-white text-blue-600' 
      : 'text-white hover:bg-blue-700';
    return `${baseClasses} ${stateClasses}`;
  };

  return (
    <>
    <div 
      className="fixed shadow-lg flex flex-col mobile-full-height"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100vh',
        minHeight: '100vh',
        width: sidebarExpanded ? '280px' : '70px',
        transition: 'width 0.3s ease',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
        {/* Header with Toggle Arrow */}
        <div className="flex items-center justify-between p-4">
          {sidebarExpanded && <h2 className="text-xl font-bold text-white">Menu</h2>}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-transparent text-white hover:bg-blue-700 transition-all duration-200 ml-auto border-0 outline-none focus:outline-none"
            style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
            title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={28} />}
          </button>
        </div>
        
        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            {/* Home Section */}
            <Link
              to="/dashboard"
              className={getSidebarItemClasses(location.pathname === '/dashboard')}
              title="Home"
            >
              <Home size={20} />
              {sidebarExpanded && <span className="font-medium">Home</span>}
            </Link>

            {/* Notifications Section */}
            <NotificationSidebarItem sidebarExpanded={sidebarExpanded} />

            {/* Admin Only */}
            {user?.role === 'admin' && (
              <Link
                to="/data-management"
                className={getSidebarItemClasses(location.pathname === '/data-management')}
                title="Data Management"
              >
                <Database size={20} />
                {sidebarExpanded && <span className="font-medium">Data Management</span>}
              </Link>
            )}

            {/* Faculty and Admin */}
            {(user?.role === 'admin' || user?.role === 'faculty') && (
              <>
                <Link
                  to="/send-message"
                  className={getSidebarItemClasses(location.pathname === '/send-message')}
                  title="Send Message"
                >
                  <Send size={20} />
                  {sidebarExpanded && <span className="font-medium">Send Message</span>}
                </Link>
                <Link
                  to="/notices/create"
                  className={getSidebarItemClasses(location.pathname === '/notices/create')}
                  title="Create Notice"
                >
                  <Plus size={20} />
                  {sidebarExpanded && <span className="font-medium">Create Notice</span>}
                </Link>
              </>
            )}

            {/* Divider */}
            {sidebarExpanded && <div className="border-t border-blue-400 my-4"></div>}

            {/* Statistics Section */}
            {user?.role === 'admin' ? (
              <>
                <Link
                  to="/users"
                  className={`flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200 ${
                    location.pathname === '/users'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-blue-700'
                  }`}
                  title="Total Users"
                >
                  <Users size={20} />
                  {sidebarExpanded && (
                    <>
                      <span className="font-medium flex-1">Total Users</span>
                      <span className="font-semibold">{stats.totalUsers || 0}</span>
                    </>
                  )}
                </Link>
                <Link
                  to="/my-created-notices"
                  className={`flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200 ${
                    location.pathname === '/my-created-notices'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-blue-700'
                  }`}
                  title="Created Notices"
                >
                  <PlusCircle size={20} />
                  {sidebarExpanded && (
                    <>
                      <span className="font-medium flex-1">Created Notices</span>
                      <span className="font-semibold">{stats.totalCreatedNotices || 0}</span>
                    </>
                  )}
                </Link>
                <Link
                  to="/messages/sent"
                  className={`flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200 ${
                    location.pathname === '/messages/sent'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-blue-700'
                  }`}
                  title="Created Messages"
                >
                  <MessageCircle size={20} />
                  {sidebarExpanded && (
                    <>
                      <span className="font-medium flex-1">Created Messages</span>
                      <span className="font-semibold">{stats.totalSentMessages || 0}</span>
                    </>
                  )}
                </Link>
              </>
            ) : user?.role === 'faculty' ? (
              <>
                <Link
                  to="/my-created-notices"
                  className={`flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200 ${
                    location.pathname === '/my-created-notices'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-blue-700'
                  }`}
                  title="Created Notices"
                >
                  <PlusCircle size={20} />
                  {sidebarExpanded && (
                    <>
                      <span className="font-medium flex-1">Created Notices</span>
                      <span className="font-semibold">{stats.totalCreatedNotices || 0}</span>
                    </>
                  )}
                </Link>
                <Link
                  to="/messages/sent"
                  className={`flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg transition-all duration-200 ${
                    location.pathname === '/messages/sent'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-blue-700'
                  }`}
                  title="Created Messages"
                >
                  <MessageCircle size={20} />
                  {sidebarExpanded && (
                    <>
                      <span className="font-medium flex-1">Created Messages</span>
                      <span className="font-semibold">{stats.totalSentMessages || 0}</span>
                    </>
                  )}
                </Link>
              </>
            ) : (
              <>
                {/* Students don't have statistics */}
              </>
            )}

            {/* Profile and Logout */}
            <Link
              to="/profile"
              className={getSidebarItemClasses(location.pathname === '/profile')}
              title="My Profile"
            >
              <User size={20} />
              {sidebarExpanded && <span className="font-medium">My Profile</span>}
            </Link>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 mx-1 rounded-lg bg-transparent text-white hover:bg-red-600 transition-all duration-200 border-0 outline-none focus:outline-none font-bold`}
              style={{ backgroundColor: 'transparent', border: 'none', fontFamily: 'inherit' }}
              title="Logout"
            >
              <LogOut size={20} />
              {sidebarExpanded && <span>Logout</span>}
            </button>
          </div>
        </div>
    </div>

    {/* Logout Confirmation Modal - Using Portal */}
    {showLogoutModal && createPortal(
      <div 
        className="fixed inset-0 flex items-center justify-center z-[10000]"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          margin: 0,
          padding: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          position: 'fixed'
        }}
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-96 mx-4" style={{ maxWidth: '90%' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
          <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={cancelLogout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium border-0 outline-none focus:outline-none"
              style={{ border: 'none', outline: 'none' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium border-0 outline-none focus:outline-none"
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', outline: 'none' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default GlobalSidebar;