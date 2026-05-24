import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import axios from '../axiosConfig';
import { Send, CheckSquare, Square, Users, AlertCircle, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const SendMessagePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Faculty access data
  const [facultyAccess, setFacultyAccess] = useState(null);
  
  // Message form data
  const [formData, setFormData] = useState({
    message: '',
    priority: 'normal'
  });
  
  // Selection state
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  // Students list and selection
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch access data on mount
  useEffect(() => {
    const fetchAccessData = async () => {
      try {
        if (user?.role === 'faculty') {
          const response = await axios.get('/api/faculty/access');
          setFacultyAccess(response.data);
          
          // Auto-select first department if available
          if (response.data.access && response.data.access.length > 0) {
            setSelectedDept(response.data.access[0].dept);
          }
        } else if (user?.role === 'admin') {
          // For admin, create a simple access structure with their department
          const adminAccess = {
            access: [{
              dept: user.dept,
              years: [
                { year: '1', sections: ['A', 'B', 'C', 'D', 'E'] },
                { year: '2', sections: ['A', 'B', 'C', 'D', 'E'] },
                { year: '3', sections: ['A', 'B', 'C', 'D', 'E'] },
                { year: '4', sections: ['A', 'B', 'C', 'D', 'E'] }
              ]
            }]
          };
          setFacultyAccess(adminAccess);
          setSelectedDept(user.dept);
        }
      } catch (error) {
        console.error('Error fetching access data:', error);
        toast.error('Failed to load access data');
      }
    };

    if (user?.role === 'faculty' || user?.role === 'admin') {
      fetchAccessData();
    }
  }, [user]);

  // Fetch students when dept/year/section is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDept || !selectedYear || !selectedSection) {
        setStudents([]);
        return;
      }

      console.log('🔍 Fetching students:', { dept: selectedDept, year: selectedYear, section: selectedSection });
      setLoadingStudents(true);
      try {
        const response = await axios.get('/api/users/students', {
          params: {
            dept: selectedDept,
            year: selectedYear,
            section: selectedSection
          }
        });
        console.log('✅ Students loaded:', response.data);
        setStudents(response.data);
        setSelectedStudents([]); // Clear previous selections
      } catch (error) {
        console.error('❌ Error fetching students:', error);
        console.error('Error response:', error.response?.data);
        toast.error('Failed to load students: ' + (error.response?.data?.message || error.message));
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedDept, selectedYear, selectedSection]);

  // Get available years for selected department
  const getAvailableYears = () => {
    if (!facultyAccess || !selectedDept) return [];
    const deptAccess = facultyAccess.access.find(a => a.dept === selectedDept);
    return deptAccess ? deptAccess.years : [];
  };

  // Get available sections for selected department and year
  const getAvailableSections = () => {
    if (!facultyAccess || !selectedDept || !selectedYear) return [];
    const deptAccess = facultyAccess.access.find(a => a.dept === selectedDept);
    if (!deptAccess) return [];
    const yearAccess = deptAccess.years.find(y => y.year === selectedYear);
    return yearAccess ? yearAccess.sections : [];
  };

  // Handle department change
  const handleDeptChange = (dept) => {
    setSelectedDept(dept);
    setSelectedYear('');
    setSelectedSection('');
    setStudents([]);
    setSelectedStudents([]);
  };

  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedSection('');
    setStudents([]);
    setSelectedStudents([]);
  };

  // Handle section change
  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setSelectedStudents([]);
  };

  // Toggle individual student selection
  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s._id));
    }
  };

  // Handle search functionality
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return; // Wait for at least 2 characters
    }

    setIsSearching(true);
    try {
      console.log('🔍 Frontend search request:', { query: query.trim(), userRole: user.role, userId: user.id });
      const response = await axios.get('/api/messages/search-users', {
        params: { 
          query: query.trim()
        }
      });
      console.log('📊 Search results received:', response.data.length, 'users');
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a user from search results
  const handleSelectSearchResult = (selectedUser) => {
    if (selectedUser.role === 'student') {
      // Add student to selected list
      if (!selectedStudents.includes(selectedUser._id)) {
        setSelectedStudents(prev => [...prev, selectedUser._id]);
        toast.success(`Added ${selectedUser.name} (${selectedUser.id}) to recipients`);
      } else {
        toast.info(`${selectedUser.name} is already selected`);
      }
    } else {
      // For faculty, we'll handle this differently since the current system is for students
      toast.info('Faculty messaging will be added in future updates');
    }
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Get role badge color
  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-500 text-white',
      faculty: 'bg-blue-500 text-white',
      student: 'bg-green-500 text-white'
    };
    return badges[role] || 'bg-gray-500 text-white';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/messages/send-bulk', {
        recipientIds: selectedStudents,
        message: formData.message,
        priority: formData.priority
      });

      toast.success(`Message sent to ${selectedStudents.length} student(s)!`);
      
      // Reset form
      setFormData({ message: '', priority: 'normal' });
      setSelectedStudents([]);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'faculty' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">This page is only accessible to faculty and admin members</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Send Message to Students</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? `Compose a message and select students from ${user.dept} department`
                : 'Compose a message and select students to send'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Message Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Message</h3>
                <p className="text-sm text-gray-600">Write your message to send to students</p>
              </div>
              
              <div className="space-y-6">
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your message here..."
                    rows="6"
                    className="input-field resize-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.message.length} characters
                  </p>
                </div>
              </div>
            </div>

            {/* Search &  */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Recipients</h3>
                <p className="text-sm text-gray-600">Search users or choose department, year, and section</p>
              </div>
              
              {/* Search Bar */}
              <div className="mb-6 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name, ID or email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Search Results ({searchResults.length})
                          </p>
                        </div>
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => handleSelectSearchResult(user)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.id}</p>
                                <p className="text-xs text-gray-500 truncate">{user.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadge(user.role)}`}>
                                {user.role}
                              </span>
                              {user.dept && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                  {user.dept}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No users found</p>
                        <p className="text-xs text-gray-500 mt-1">Try searching with a different term</p>
                      </div>
                    )}
                  </div>
                )}
                
                {searchQuery && searchQuery.length < 2 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {/* Department Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {facultyAccess?.access.map(access => (
                      <button
                        key={access.dept}
                        type="button"
                        onClick={() => handleDeptChange(access.dept)}
                        className={`p-2 text-sm font-medium rounded border transition-colors ${
                          selectedDept === access.dept
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {access.dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Selection */}
                {selectedDept && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableYears().map(yearObj => (
                        <button
                          key={yearObj.year}
                          type="button"
                          onClick={() => handleYearChange(yearObj.year)}
                          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                            selectedYear === yearObj.year
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Year {yearObj.year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Selection */}
                {selectedYear && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableSections().map(section => (
                        <button
                          key={section}
                          type="button"
                          onClick={() => handleSectionChange(section)}
                          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                            selectedSection === section
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Section {section}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Students List */}
            {selectedSection && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedDept} - Year {selectedYear} - Section {selectedSection}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedStudents.length} of {students.length} students selected
                    </p>
                  </div>
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50 transition"
                    >
                      {selectedStudents.length === students.length ? (
                        <>
                          <Square size={16} />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare size={16} />
                          Select All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {loadingStudents ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No students found in this section</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2">
                    {students.map(student => (
                      <label
                        key={student._id}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedStudents.includes(student._id)
                            ? 'bg-blue-50 border-blue-600'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => toggleStudent(student._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className={`text-sm font-medium ${
                          selectedStudents.includes(student._id) ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          {student.id}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedStudents.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send to {selectedStudents.length} Student(s)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendMessagePage;
