import { Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationButton from './NotificationButton';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">SCNBCP</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell size={22} className="text-gray-600" />
          {/* You can add notification badge here if needed */}
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="My Profile"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;