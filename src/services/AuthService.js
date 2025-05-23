import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}/auth/`;

/**
 * Service for authentication related operations
 */
const AuthService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(API_URL + 'login/', { username, password });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        // Add token to all future API requests
        axios.defaults.headers.common['Authorization'] = 'Token ' + response.data.token;
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  
  logout: async () => {
    try {
      // Call the logout endpoint to invalidate token
      await axios.post(API_URL + 'logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Even if the server call fails, clear local storage
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    }
  },
  
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  checkAuth: async () => {
    try {
      const response = await axios.get(API_URL + 'check/');
      return response.data;
    } catch (error) {
      // If authentication fails, clear the stored user
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      }
      return { authenticated: false };
    }
  },


  // Set up axios interceptors
  setupAxiosInterceptors: () => {
    // Request interceptor - adds token to all requests
    axios.interceptors.request.use(
      (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
          config.headers.Authorization = `Token ${user.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor - handle 401 errors globally
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Auto logout if 401 response returned from API
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          // You can dispatch an action or use window.location to redirect
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
};

export default AuthService;
