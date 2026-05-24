import axios from 'axios';

// Set the base URL for all API calls
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://college-communication-portal.onrender.com';

// Add a request interceptor to automatically add the token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Axios Interceptor - Token:', token ? 'Found' : 'Not found');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Axios Interceptor - Added Authorization header');
    }
    return config;
  },
  (error) => {
    console.error('Axios Interceptor - Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to home if it's a token expiration (not a login failure)
    if (error.response?.status === 401 && error.config.url !== '/api/auth/login') {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axios;
