import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Upload, X, Calendar, Users, AlertCircle } from 'lucide-react';
import { storage } from '../utils/storage';

const CreateNoticePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    targetAudience: {
      roles: [],
      departments: [],
      years: [],
      sections: []
    },
    scheduledDate: '',
    expiryDate: '',
    allowFileSubmissions: false
  });

  // Store hierarchical selections for better organization
  const [hierarchicalSelections, setHierarchicalSelections] = useState({});
  
  // Store faculty and admin lists for individual selection
  const [facultyList, setFacultyList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  
  // Store student filtering options
  const [studentFilters, setStudentFilters] = useState({});
  const [specificStudentIds, setSpecificStudentIds] = useState({});
  const [attachments, setAttachments] = useState([]);
  
  // For faculty - their accessible data
  const [facultyAccess, setFacultyAccess] = useState(null);
  
  // For admin - department structures
  const [departmentStructures, setDepartmentStructures] = useState([]);
  
  // For admin - simplified target selection
  const [adminTargetSelection, setAdminTargetSelection] = useState({
    allStudents: false,
    selectedYears: [], // ['1', '2', '3', '4']
    yearSections: {} // { '1': ['A', 'B'], '2': 'all' }
  });
  
  // No longer needed - using static options for years and sections

  const categories = [
    { value: 'academic', label: 'Academic' },
    { value: 'event', label: 'Events' },
    { value: 'exam', label: 'Exams' },
    { value: 'placement', label: 'Placements' },
    { value: 'circular', label: 'Circulars' },
    { value: 'general', label: 'General' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const roles = [
    { value: 'student', label: 'Students' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'admin', label: 'Admin' }
  ];

  // Fetch faculty access or department structures on mount
  useEffect(() => {
    const fetchAccessData = async () => {
      try {
        if (user.role === 'faculty') {
          const response = await axios.get('/api/faculty/access');
          setFacultyAccess(response.data);
        } else if (user.role === 'admin') {
          const response = await axios.get('/api/department-structure');
          setDepartmentStructures(response.data);
        }
        
        // Fetch faculty and admin lists for individual targeting
        await fetchFacultyAndAdminLists();
      } catch (error) {
        console.error('Error fetching access data:', error);
        toast.error('Failed to load department data');
      }
    };

    fetchAccessData();
  }, [user.role]);

  // Fetch faculty and admin lists
  const fetchFacultyAndAdminLists = async () => {
    try {
      console.log('🔄 Fetching faculty and admin lists...');
      
      // Fetch faculty list
      const facultyResponse = await axios.get('/api/users/faculty-list');
      console.log('✅ Faculty list response:', facultyResponse.data);
      setFacultyList(facultyResponse.data);
      
      // Fetch admin list
      const adminResponse = await axios.get('/api/users/admin-list');
      console.log('✅ Admin list response:', adminResponse.data);
      setAdminList(adminResponse.data);
    } catch (error) {
      console.error('❌ Error fetching user lists:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load faculty/admin lists: ' + (error.response?.data?.message || error.message));
    }
  };

  // Get years available for a specific department
  const getDepartmentYears = (dept) => {
    if (user.role === 'faculty' && facultyAccess) {
      const deptAccess = facultyAccess.access.find(access => access.dept === dept);
      return deptAccess ? deptAccess.years.map(y => y.year) : [];
    } else if (user.role === 'admin' && departmentStructures.length > 0) {
      const deptStruct = departmentStructures.find(ds => ds.dept === dept);
      return deptStruct ? deptStruct.years.map(y => y.year) : [];
    }
    return [];
  };

  // Get sections available for a specific department and year
  const getDepartmentYearSections = (dept, year) => {
    if (user.role === 'faculty' && facultyAccess) {
      const deptAccess = facultyAccess.access.find(access => access.dept === dept);
      if (deptAccess) {
        const yearAccess = deptAccess.years.find(y => y.year === year);
        return yearAccess ? yearAccess.sections : [];
      }
    } else if (user.role === 'admin' && departmentStructures.length > 0) {
      const deptStruct = departmentStructures.find(ds => ds.dept === dept);
      if (deptStruct) {
        const yearStruct = deptStruct.years.find(y => y.year === year);
        return yearStruct ? yearStruct.sections : [];
      }
    }
    return [];
  };

  // Check if department is selected (has any years with sections)
  const isDepartmentSelected = (dept) => {
    if (!hierarchicalSelections[dept]) return false;
    
    // Check if any year has any sections selected
    return Object.keys(hierarchicalSelections[dept]).some(year => 
      Object.keys(hierarchicalSelections[dept][year]).length > 0
    );
  };

  // Check if year is selected for a department (has any sections)
  const isYearSelected = (dept, year) => {
    return hierarchicalSelections[dept] && hierarchicalSelections[dept][year] && 
           Object.keys(hierarchicalSelections[dept][year]).length > 0;
  };

  // Check if section is selected for a department-year
  const isSectionSelected = (dept, year, section) => {
    return hierarchicalSelections[dept] && hierarchicalSelections[dept][year] && 
           hierarchicalSelections[dept][year][section];
  };

  // Handle department toggle (expand/collapse or select/deselect all)
  const handleDepartmentToggle = (dept) => {
    const newSelections = { ...hierarchicalSelections };
    
    if (hierarchicalSelections[dept]) {
      // Department is currently expanded/selected - remove it completely
      delete newSelections[dept];
      console.log(`🗑️ Deselected department: ${dept}`);
    } else {
      // Department not selected - expand it (show years)
      newSelections[dept] = {};
      console.log(`✅ Selected department: ${dept}`);
    }
    
    setHierarchicalSelections(newSelections);
    updateFormDataFromHierarchy();
  };

  // Handle year toggle for a specific department
  const handleYearToggle = (dept, year) => {
    const newSelections = { ...hierarchicalSelections };
    
    if (!newSelections[dept]) newSelections[dept] = {};
    
    if (newSelections[dept][year]) {
      // Year is currently selected - remove it and all its sections
      delete newSelections[dept][year];
      console.log(`🗑️ Deselected year: ${dept} - Year ${year}`);
      
      // If no years left in department, remove department
      if (Object.keys(newSelections[dept]).length === 0) {
        delete newSelections[dept];
        console.log(`🗑️ Removed empty department: ${dept}`);
      }
    } else {
      // Year not selected - expand it (show sections)
      newSelections[dept][year] = {};
      console.log(`✅ Selected year: ${dept} - Year ${year}`);
    }
    
    setHierarchicalSelections(newSelections);
    updateFormDataFromHierarchy();
  };

  // Handle section toggle for a specific department-year
  const handleSectionToggle = (dept, year, section) => {
    const newSelections = { ...hierarchicalSelections };
    
    if (!newSelections[dept]) newSelections[dept] = {};
    if (!newSelections[dept][year]) newSelections[dept][year] = {};
    
    if (newSelections[dept][year][section]) {
      // Section is currently selected - remove it
      delete newSelections[dept][year][section];
      console.log(`🗑️ Deselected section: ${dept} - Year ${year} - Section ${section}`);
      
      // Clean up empty parent objects
      if (Object.keys(newSelections[dept][year]).length === 0) {
        delete newSelections[dept][year];
        console.log(`🗑️ Removed empty year: ${dept} - Year ${year}`);
        
        if (Object.keys(newSelections[dept]).length === 0) {
          delete newSelections[dept];
          console.log(`🗑️ Removed empty department: ${dept}`);
        }
      }
      
      // Clear student filters for this section
      const filterKey = `${dept}-${year}-${section}`;
      setStudentFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[filterKey];
        return newFilters;
      });
      setSpecificStudentIds(prev => {
        const newIds = { ...prev };
        delete newIds[filterKey];
        return newIds;
      });
    } else {
      // Section not selected - add it
      newSelections[dept][year][section] = true;
      console.log(`✅ Selected section: ${dept} - Year ${year} - Section ${section}`);
    }
    
    setHierarchicalSelections(newSelections);
    updateFormDataFromHierarchy();
  };

  // Update form data from hierarchical selections
  const updateFormDataFromHierarchy = () => {
    if (!hierarchicalSelections || Object.keys(hierarchicalSelections).length === 0) {
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          departments: [],
          years: [],
          sections: []
        }
      }));
      return;
    }

    const departments = Object.keys(hierarchicalSelections);
    const years = [];
    const sections = [];

    departments.forEach(dept => {
      if (hierarchicalSelections[dept]) {
        Object.keys(hierarchicalSelections[dept]).forEach(year => {
          if (!years.includes(year)) years.push(year);
          if (hierarchicalSelections[dept][year]) {
            Object.keys(hierarchicalSelections[dept][year]).forEach(section => {
              if (!sections.includes(section)) sections.push(section);
            });
          }
        });
      }
    });

    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        departments: departments.sort(),
        years: years.sort(),
        sections: sections.sort()
      }
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get department-specific colors - all blue
  const getDepartmentColor = (dept) => {
    // All departments use blue color scheme
    return {
      bg: 'bg-blue-600',
      hover: 'hover:border-blue-600 hover:bg-blue-50',
      border: 'border-blue-600',
      text: 'text-white',
      checkBg: 'bg-white',
      checkText: 'text-blue-600'
    };
  };

  const handleRoleToggle = (role) => {
    const isCurrentlySelected = formData.targetAudience.roles.includes(role);
    
    if (isCurrentlySelected) {
      // Remove role and clear related selections
      if (role === 'faculty') {
        setSelectedFacultyIds([]);
      } else if (role === 'admin') {
        setSelectedAdminIds([]);
      } else if (role === 'student') {
        setHierarchicalSelections({});
      }
    }
    
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        roles: isCurrentlySelected
          ? prev.targetAudience.roles.filter(r => r !== role)
          : [...prev.targetAudience.roles, role],
        // Clear departments/years/sections when deselecting students
        ...(role === 'student' && isCurrentlySelected ? {
          departments: [],
          years: [],
          sections: []
        } : {})
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.targetAudience.roles.length === 0) {
      toast.error('Please select at least one audience role');
      return;
    }
    
    // Validate student selections
    if (formData.targetAudience.roles.includes('student')) {
      if (formData.targetAudience.departments.length === 0) {
        toast.error('Please select at least one department for students');
        return;
      }
      
      if (formData.targetAudience.years.length === 0) {
        toast.error('Please select at least one year for students');
        return;
      }
      
      if (formData.targetAudience.sections.length === 0) {
        toast.error('Please select at least one section for students');
        return;
      }
    }
    
    // Validate faculty selections
    if (formData.targetAudience.roles.includes('faculty') && selectedFacultyIds.length === 0) {
      toast.error('Please select at least one faculty member');
      return;
    }
    
    // Validate admin selections
    if (formData.targetAudience.roles.includes('admin') && selectedAdminIds.length === 0) {
      toast.error('Please select at least one admin member');
      return;
    }
    
    setLoading(true);

    try {
      const submitData = new FormData();
      // Prepare student filters array
      const studentFiltersArray = [];
      Object.keys(hierarchicalSelections).forEach(dept => {
        Object.keys(hierarchicalSelections[dept]).forEach(year => {
          Object.keys(hierarchicalSelections[dept][year]).forEach(section => {
            const key = `${dept}-${year}-${section}`;
            const filterType = studentFilters[key] || 'all';
            const specificIds = filterType === 'specific' 
              ? (specificStudentIds[key] || '').split(',').map(id => id.trim()).filter(id => id)
              : [];
            
            studentFiltersArray.push({
              dept,
              year,
              section,
              filterType,
              specificIds
            });
          });
        });
      });

      // Prepare target audience with specific user IDs and student filters
      const targetAudienceWithUsers = {
        ...formData.targetAudience,
        studentFilters: studentFiltersArray,
        specificUsers: {
          faculty: selectedFacultyIds,
          admin: selectedAdminIds
        }
      };

      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('category', formData.category);
      submitData.append('priority', formData.priority);
      submitData.append('targetAudience', JSON.stringify(targetAudienceWithUsers));
      submitData.append('allowFileSubmissions', formData.allowFileSubmissions);
      
      if (formData.scheduledDate) {
        submitData.append('scheduledDate', formData.scheduledDate);
      }
      if (formData.expiryDate) {
        submitData.append('expiryDate', formData.expiryDate);
      }

      attachments.forEach(file => {
        submitData.append('attachments', file);
      });

      const token = storage.getToken();
      
      if (!token) {
        toast.error('Please login again');
        navigate('/faculty-login');
        return;
      }

      const response = await axios.post('/api/notices', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Notice created successfully!');
      navigate('/notices');
      
    } catch (error) {
      console.error('❌ Error creating notice:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        storage.removeToken();
        navigate('/faculty-login');
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to create notice';
        console.error('Showing error:', errorMsg);
        toast.error(errorMsg);
        alert(`Error: ${errorMsg}`); // Also show alert for debugging
      }
    } finally {
      setLoading(false);
    }
  };

  // Get available departments based on user role
  const getAvailableDepartments = () => {
    if (user.role === 'faculty' && facultyAccess) {
      return facultyAccess.departments;
    } else if (user.role === 'admin') {
      // Admin can only send to their own department
      return [user.dept];
    }
    return [];
  };



  // Handle faculty ID selection
  const handleFacultyIdToggle = (facultyId) => {
    setSelectedFacultyIds(prev => 
      prev.includes(facultyId)
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  // Handle admin ID selection
  const handleAdminIdToggle = (adminId) => {
    setSelectedAdminIds(prev => 
      prev.includes(adminId)
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  // Admin-specific handlers
  const handleAdminAllStudentsToggle = () => {
    const newAllStudentsState = !adminTargetSelection.allStudents;
    
    setAdminTargetSelection(prev => ({
      allStudents: newAllStudentsState,
      selectedYears: newAllStudentsState ? [] : prev.selectedYears,
      yearSections: newAllStudentsState ? {} : prev.yearSections
    }));
    
    if (newAllStudentsState) {
      // Select all years and sections
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          departments: [user.dept],
          years: ['1', '2', '3', '4'],
          sections: ['A', 'B', 'C', 'D', 'E']
        }
      }));
    } else {
      // Deselect - clear all
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          departments: [],
          years: [],
          sections: []
        }
      }));
    }
  };

  const handleAdminYearToggle = (year) => {
    setAdminTargetSelection(prev => {
      const isSelected = prev.selectedYears.includes(year);
      const newSelectedYears = isSelected
        ? prev.selectedYears.filter(y => y !== year)
        : [...prev.selectedYears, year];
      
      const newYearSections = { ...prev.yearSections };
      if (isSelected) {
        delete newYearSections[year];
      }
      
      return {
        ...prev,
        allStudents: false,
        selectedYears: newSelectedYears,
        yearSections: newYearSections
      };
    });
  };

  const handleAdminYearAllStudents = (year) => {
    setAdminTargetSelection(prev => {
      const isCurrentlyAll = prev.yearSections[year] === 'all';
      const newYearSections = { ...prev.yearSections };
      
      if (isCurrentlyAll) {
        // Deselect - remove this year's sections
        delete newYearSections[year];
      } else {
        // Select all sections for this year
        newYearSections[year] = 'all';
      }
      
      return {
        ...prev,
        yearSections: newYearSections
      };
    });
    
    // Update formData
    const currentYears = adminTargetSelection.selectedYears.includes(year) 
      ? adminTargetSelection.selectedYears 
      : [...adminTargetSelection.selectedYears, year];
    
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        departments: [user.dept],
        years: currentYears,
        sections: ['A', 'B', 'C', 'D', 'E']
      }
    }));
  };

  const handleAdminSectionToggle = (year, section) => {
    let updatedYearSections;
    
    setAdminTargetSelection(prev => {
      const currentSections = prev.yearSections[year];
      let newSections;
      
      if (currentSections === 'all') {
        newSections = [section];
      } else if (Array.isArray(currentSections)) {
        newSections = currentSections.includes(section)
          ? currentSections.filter(s => s !== section)
          : [...currentSections, section];
      } else {
        newSections = [section];
      }
      
      updatedYearSections = {
        ...prev.yearSections,
        [year]: newSections.length > 0 ? newSections : undefined
      };
      
      return {
        ...prev,
        yearSections: updatedYearSections
      };
    });
    
    // Update formData immediately with new selections
    setTimeout(() => {
      const years = adminTargetSelection.selectedYears;
      const allSections = new Set();
      
      years.forEach(y => {
        const sections = updatedYearSections[y];
        if (sections === 'all') {
          ['A', 'B', 'C', 'D', 'E'].forEach(s => allSections.add(s));
        } else if (Array.isArray(sections)) {
          sections.forEach(s => allSections.add(s));
        }
      });
      
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          departments: [user.dept],
          years: years,
          sections: Array.from(allSections)
        }
      }));
    }, 0);
  };

  const updateAdminFormData = () => {
    const years = adminTargetSelection.selectedYears;
    const allSections = new Set();
    
    years.forEach(year => {
      const sections = adminTargetSelection.yearSections[year];
      if (sections === 'all') {
        ['A', 'B', 'C', 'D', 'E'].forEach(s => allSections.add(s));
      } else if (Array.isArray(sections)) {
        sections.forEach(s => allSections.add(s));
      }
    });
    
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        departments: [user.dept],
        years: years,
        sections: Array.from(allSections)
      }
    }));
  };

  // Handle student filter selection
  const handleStudentFilterChange = (dept, year, section, filterType) => {
    const key = `${dept}-${year}-${section}`;
    setStudentFilters(prev => ({
      ...prev,
      [key]: filterType
    }));
    
    // Clear specific student IDs when changing filter type
    if (filterType !== 'specific') {
      setSpecificStudentIds(prev => {
        const newIds = { ...prev };
        delete newIds[key];
        return newIds;
      });
    }
  };

  // Handle specific student ID input
  const handleSpecificStudentIds = (dept, year, section, ids) => {
    const key = `${dept}-${year}-${section}`;
    setSpecificStudentIds(prev => ({
      ...prev,
      [key]: ids
    }));
  };

  // Update form data whenever hierarchical selections change
  useEffect(() => {
    updateFormDataFromHierarchy();
  }, [hierarchicalSelections]);

  // Debug logging
  useEffect(() => {
    console.log('User role:', user?.role);
    console.log('Faculty access:', facultyAccess);
    console.log('Department structures:', departmentStructures);
    console.log('Available departments:', getAvailableDepartments());
  }, [facultyAccess, departmentStructures, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Notice</h1>
            <p className="text-gray-600 mt-1">Share important information with your audience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                <p className="text-sm text-gray-600">Enter the main details of your notice</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="input-field"
                    placeholder="Enter notice title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="input-field"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    required
                    className="input-field"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Content *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={6}
                    className="input-field resize-none"
                    placeholder="Enter the detailed content of your notice..."
                    value={formData.content}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Target Audience</h3>
                <p className="text-sm text-gray-600">Select who should receive this notice</p>
              </div>
              
              {/* Roles Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Who should see this notice? *
                </label>
                <div className="flex flex-wrap gap-3">
                  {roles.map(role => (
                    <label key={role.value} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        checked={formData.targetAudience.roles.includes(role.value)}
                        onChange={() => handleRoleToggle(role.value)}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Student Selection */}
              {formData.targetAudience.roles.includes('student') && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Student Selection</h4>
                  
                  {/* Admin Simplified UI */}
                  {user.role === 'admin' && (
                    <div className="space-y-6">
                      {/* Department Display (Auto-selected) */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Department:</span> {user.dept}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">Notices will be sent to students in your department only</p>
                      </div>

                      {/* All Students Button */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleAdminAllStudentsToggle}
                          className={`px-6 py-3 rounded-lg font-medium transition-all shadow-md ${
                            adminTargetSelection.allStudents
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          📢 All Students
                        </button>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Note:</span> Send to all students (Years 1-4, All sections) in {user.dept}
                        </p>
                      </div>

                      {/* Year Selection */}
                      {!adminTargetSelection.allStudents && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Select Year(s)</label>
                          <div className="flex flex-wrap gap-3">
                            {['1', '2', '3', '4'].map(year => (
                              <button
                                key={year}
                                type="button"
                                onClick={() => handleAdminYearToggle(year)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  adminTargetSelection.selectedYears.includes(year)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500'
                                }`}
                              >
                                Year {year}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section Selection for Each Year */}
                      {!adminTargetSelection.allStudents && adminTargetSelection.selectedYears.length > 0 && (
                        <div className="space-y-4">
                          {adminTargetSelection.selectedYears.map(year => (
                            <div key={year} className="bg-gray-50 rounded-lg p-4">
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Year {year} - Sections</h5>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleAdminYearAllStudents(year)}
                                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                                      adminTargetSelection.yearSections[year] === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                                    }`}
                                  >
                                    All Students
                                  </button>
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Note:</span> All Year {year} students (all sections)
                                  </p>
                                </div>
                              </div>
                              
                              {adminTargetSelection.yearSections[year] !== 'all' && (
                                <div className="flex flex-wrap gap-2">
                                  {['A', 'B', 'C', 'D', 'E'].map(section => (
                                    <button
                                      key={section}
                                      type="button"
                                      onClick={() => handleAdminSectionToggle(year, section)}
                                      className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                                        Array.isArray(adminTargetSelection.yearSections[year]) && 
                                        adminTargetSelection.yearSections[year].includes(section)
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                                      }`}
                                    >
                                      Sec {section}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Faculty Complex UI (Existing) */}
                  {user.role === 'faculty' && (
                    <>
                      {/* Department Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {getAvailableDepartments().map(dept => (
                            <button
                              key={dept}
                              type="button"
                              className={`p-2 text-xs font-medium rounded border transition-colors ${
                                hierarchicalSelections[dept] 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleDepartmentToggle(dept)}
                            >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Years and Sections for Selected Departments */}
                  {Object.keys(hierarchicalSelections).length > 0 && (
                    <div className="space-y-6">
                      {Object.keys(hierarchicalSelections).map(dept => (
                        <div key={dept} className="bg-gray-50 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">{dept} Department</h5>

                          {/* Years */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-2">Years</label>
                            <div className="flex flex-wrap gap-2">
                              {getDepartmentYears(dept).map(year => (
                                <button
                                  key={`${dept}-${year}`}
                                  type="button"
                                  className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                                    hierarchicalSelections[dept] && hierarchicalSelections[dept][year]
                                      ? 'bg-blue-600 text-white border-blue-600' 
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleYearToggle(dept, year)}
                                >
                                  Year {year}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Sections for Selected Years */}
                          {Object.keys(hierarchicalSelections[dept] || {}).length > 0 && (
                            <div className="space-y-4">
                              {Object.keys(hierarchicalSelections[dept] || {}).map(year => (
                                <div key={`${dept}-${year}`} className="bg-white rounded p-3 border border-gray-200">
                                  <h6 className="text-xs font-medium text-gray-700 mb-2">Year {year} - Sections</h6>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {getDepartmentYearSections(dept, year).map(section => (
                                      <button
                                        key={`${dept}-${year}-${section}`}
                                        type="button"
                                        className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                                          isSectionSelected(dept, year, section)
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => handleSectionToggle(dept, year, section)}
                                      >
                                        {section}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Student Filter Options */}
                                  {getDepartmentYearSections(dept, year).some(section => isSectionSelected(dept, year, section)) && (
                                    <div className="bg-blue-50 rounded p-3 border border-blue-200">
                                      <h6 className="text-xs font-medium text-gray-700 mb-2">Student Filters</h6>
                                      
                                      {getDepartmentYearSections(dept, year).map(section => (
                                        isSectionSelected(dept, year, section) && (
                                          <div key={`filter-${dept}-${year}-${section}`} className="mb-3 last:mb-0">
                                            <p className="text-xs font-medium text-gray-600 mb-2">Section {section}:</p>
                                            
                                            <div className="flex flex-wrap gap-2 mb-2">
                                              <label className="inline-flex items-center">
                                                <input
                                                  type="radio"
                                                  name={`filter-${dept}-${year}-${section}`}
                                                  className="text-blue-600 focus:ring-blue-500 h-3 w-3"
                                                  checked={studentFilters[`${dept}-${year}-${section}`] === 'all' || !studentFilters[`${dept}-${year}-${section}`]}
                                                  onChange={() => handleStudentFilterChange(dept, year, section, 'all')}
                                                />
                                                <span className="ml-1 text-xs text-gray-700">All</span>
                                              </label>

                                              <label className="inline-flex items-center">
                                                <input
                                                  type="radio"
                                                  name={`filter-${dept}-${year}-${section}`}
                                                  className="text-blue-600 focus:ring-blue-500 h-3 w-3"
                                                  checked={studentFilters[`${dept}-${year}-${section}`] === 'both'}
                                                  onChange={() => handleStudentFilterChange(dept, year, section, 'both')}
                                                />
                                                <span className="ml-1 text-xs text-gray-700">CR & LR</span>
                                              </label>
                                            </div>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}

              {/* Faculty Selection */}
              {formData.targetAudience.roles.includes('faculty') && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Faculty Selection</h4>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {facultyList.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {facultyList.map(faculty => (
                          <label key={faculty._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              checked={selectedFacultyIds.includes(faculty._id)}
                              onChange={() => handleFacultyIdToggle(faculty._id)}
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                              <p className="text-xs text-gray-500">{faculty.id} - {faculty.dept}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">Loading faculty list...</div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Selection */}
              {formData.targetAudience.roles.includes('admin') && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Admin Selection</h4>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {adminList.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {adminList.map(admin => (
                          <label key={admin._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              checked={selectedAdminIds.includes(admin._id)}
                              onChange={() => handleAdminIdToggle(admin._id)}
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                              <p className="text-xs text-gray-500">{admin.id} - {admin.dept}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">Loading admin list...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Scheduling</h3>
                <p className="text-sm text-gray-600">Optional scheduling settings</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule for later
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledDate"
                    name="scheduledDate"
                    className="input-field"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry date
                  </label>
                  <input
                    type="datetime-local"
                    id="expiryDate"
                    name="expiryDate"
                    className="input-field"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* File Submission Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Student File Submissions</h3>
                <p className="text-sm text-gray-600">Allow students to submit files as responses</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="allowFileSubmissions"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                  checked={formData.allowFileSubmissions || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    allowFileSubmissions: e.target.checked
                  }))}
                />
                <div>
                  <label htmlFor="allowFileSubmissions" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Allow students to submit files for this notice
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, students can upload files as responses to this notice.
                  </p>
                </div>
              </div>
              
              {formData.allowFileSubmissions && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>File submission enabled.</strong> Students will see an upload option when viewing this notice.
                  </p>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Attachments</h3>
                <p className="text-sm text-gray-600">Add files to your notice (optional)</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="attachments"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="mr-2" size={16} />
                    Choose Files
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, PPT, PPTX, JPG, PNG
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
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
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/notices')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    <span>Create Notice</span>
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

export default CreateNoticePage;
