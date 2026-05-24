import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Bell, FileText, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh dashboard when user navigates back to it
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      fetchDashboardData();
    }
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/dashboard');
      setStats(response.data);
      setRecentNotices(response.data.recentNotices || []);
      console.log('📊 Dashboard data refreshed:', response.data);
      
      // Fetch recent messages
      const messagesResponse = await axios.get('/api/messages/recent?limit=5');
      setRecentMessages(messagesResponse.data);
      console.log('📬 Recent messages loaded:', messagesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleMessageClick = (messageId) => {
    navigate(`/messages/${messageId}`);
  };



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getMessagePriorityColor = (priority) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vignan-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8 text-white border border-blue-500">
            <h1 className="text-4xl font-bold mb-3">
              {getGreeting()}, {user?.id}
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Welcome to your {user?.role} dashboard. Stay updated with the latest notices and announcements.
            </p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>



        {/* Recent Notices - Single Column for All Roles */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Notices</h3>
                <Link
                  to="/notices"
                  className="text-vignan-blue hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentNotices.length > 0 ? (
                recentNotices.map((notice) => (
                  <Link
                    key={notice._id}
                    to={`/notices/${notice._id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getCategoryIcon(notice.category)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notice.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                            {notice.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notice.content}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>By {notice.author?.name}</span>
                          <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                          <span className="capitalize">{notice.category}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notices yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    New notices will appear here when they're posted.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
                <span className="text-sm text-gray-500">Last 5 messages</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <div
                    key={message._id}
                    onClick={() => handleMessageClick(message._id)}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            From: {message.sender?.name}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMessagePriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                          {!message.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {message.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{message.sender?.role}</span>
                          <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    New messages from faculty will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/notices"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                  style={{ textDecoration: 'none' }}
                >
                  <Bell className="h-5 w-5 text-vignan-blue mr-3" />
                  <span className="text-sm font-medium text-gray-900">View All Notices</span>
                </Link>
                {(user?.role === 'admin' || user?.role === 'faculty') && (
                  <Link
                    to="/my-created-notices"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <FileText className="h-5 w-5 text-vignan-blue mr-3" />
                    <span className="text-sm font-medium text-gray-900">My Created Notices ({stats.totalCreatedNotices || 0})</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Comments/Responses Section for Faculty and Admin */}
            {(user?.role === 'admin' || user?.role === 'faculty') ? (
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Comments/Responses</h3>
                <div className="space-y-3">
                  <Link
                    to="/comments"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <MessageCircle className="h-5 w-5 text-vignan-blue mr-3" />
                    <span className="text-sm font-medium text-gray-900">View Comments</span>
                  </Link>
                  <Link
                    to="/responses"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <FileText className="h-5 w-5 text-vignan-blue mr-3" />
                    <span className="text-sm font-medium text-gray-900">View Responses</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Department Info for Students */
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Department Info</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Department:</span> {user?.dept}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Role:</span> <span className="capitalize">{user?.role}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;