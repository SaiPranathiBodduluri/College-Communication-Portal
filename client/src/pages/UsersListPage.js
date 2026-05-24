import { useState, useEffect } from 'react';

import Navbar from '../components/Navbar';
import axios from '../axiosConfig';
import { Search, Mail, Phone, User, GraduationCap, Shield, ArrowLeft, Crown, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsersListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('student');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, activeTab, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch students, faculty, and admins
      const [studentsResponse, facultyResponse, adminsResponse] = await Promise.all([
        axios.get('/api/users/students/all'),
        axios.get('/api/users/faculty/all'),
        axios.get('/api/users/admins/all')
      ]);

      const allUsers = [
        ...studentsResponse.data.map(student => ({ ...student, userType: 'student' })),
        ...facultyResponse.data.map(faculty => ({ ...faculty, userType: 'faculty' })),
        ...adminsResponse.data.map(admin => ({ ...admin, userType: 'admin' }))
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by tab
    filtered = filtered.filter(user => user.userType === activeTab);

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.id?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term) ||
        user.phoneNumber?.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  };

  const getUserIcon = (userType) => {
    switch (userType) {
      case 'student': return <GraduationCap size={20} className="text-green-600" />;
      case 'faculty': return <Shield size={20} className="text-blue-600" />;
      case 'admin': return <Crown size={20} className="text-purple-600" />;
      default: return <User size={20} className="text-gray-600" />;
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'student': return 'bg-green-100 text-green-800';
      case 'faculty': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTabCount = (type) => {
    return users.filter(user => user.userType === type).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <ArrowLeft 
                size={20} 
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              />
              <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, ID, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex space-x-1 border-b border-gray-200 mb-6">
              {[
                { key: 'student', label: 'Students', icon: GraduationCap },
                { key: 'faculty', label: 'Faculty', icon: Shield },
                { key: 'admin', label: 'Admins', icon: Crown }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getTabCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((userData) => (
                  <div
                    key={`${userData.userType}-${userData.id}`}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getUserIcon(userData.userType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {userData.id}
                          </h3>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <User size={12} />
                            <span>{userData.name}</span>
                          </div>
                          
                          {userData.year && userData.section && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <BookOpen size={12} />
                              <span>Year {userData.year}, Section {userData.section}</span>
                            </div>
                          )}
                          
                          {(userData.userType === 'faculty' || userData.userType === 'admin') && userData.access && userData.access.length > 0 && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <Users size={12} />
                              <span>
                                {userData.access.map((acc, index) => (
                                  <span key={index}>
                                    {acc.dept} Y{acc.year} {acc.sections.join(',')}
                                    {index < userData.access.length - 1 ? '; ' : ''}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                          
                          {userData.email && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <Mail size={12} />
                              <span className="truncate">{userData.email}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Phone size={12} />
                            <span>{userData.phone || userData.phoneNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersListPage;