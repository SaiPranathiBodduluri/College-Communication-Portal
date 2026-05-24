import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    year: '',
    employeeId: '',
    rollNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const departments = [
    'Computer Science Engineering',
    'Electronics and Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology',
    'Management Studies',
    'Sciences and Humanities'
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...submitData } = formData;
    const result = await register(submitData);
    
    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-vignan-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">V</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Join SCNBCP
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account for Vignan University
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field mt-1"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-field mt-1"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="input-field mt-1"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  required
                  className="input-field mt-1"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.role === 'student' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    required
                    className="input-field mt-1"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700">
                    Roll Number
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    className="input-field mt-1"
                    placeholder="Enter roll number"
                    value={formData.rollNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {(formData.role === 'faculty' || formData.role === 'admin') && (
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Enter employee ID"
                  value={formData.employeeId}
                  onChange={handleChange}
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-vignan-blue hover:text-blue-700"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-6">
            <Link
              to="/"
              className="w-full btn-secondary text-center block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;