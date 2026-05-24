import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(storage.getToken());

  useEffect(() => {
    const savedToken = storage.getToken();
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      storage.removeToken();
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginId, password, role) => {
    try {
      console.log('🔐 Attempting login for:', loginId, 'as', role);
      const response = await axios.post('/api/auth/login', { loginId, password, role });
      const { token, user } = response.data;
      
      console.log('✅ Login successful!');
      console.log('User:', user.name, user.role);
      
      // Save token using storage utility
      storage.setToken(token);
      
      // Verify token was saved
      const hasToken = storage.hasToken();
      console.log('Token saved and verified:', hasToken ? 'YES ✅' : 'NO ❌');
      
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };



  const logout = () => {
    storage.removeToken();
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};