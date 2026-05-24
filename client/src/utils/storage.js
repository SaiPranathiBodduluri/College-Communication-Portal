// Simple storage utility for token management

export const storage = {
  // Save token
  setToken: (token) => {
    try {
      localStorage.setItem('authToken', token);
      console.log('✅ Token saved to localStorage');
      return true;
    } catch (error) {
      console.error('❌ Error saving token:', error);
      return false;
    }
  },

  // Get token
  getToken: () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token from storage:', token ? 'Found' : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  },

  // Remove token
  removeToken: () => {
    try {
      localStorage.removeItem('authToken');
      console.log('✅ Token removed from localStorage');
      return true;
    } catch (error) {
      console.error('❌ Error removing token:', error);
      return false;
    }
  },

  // Check if token exists
  hasToken: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  }
};
