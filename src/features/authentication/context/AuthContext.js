import React, { createContext, useState, useEffect, useContext } from 'react';
import { message } from 'antd';
import AuthService from '../../../services/AuthService';
import UserModel from '../models/UserModel';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up interceptors when the app initializes
    AuthService.setupAxiosInterceptors();
    
    // Check if user data exists in localStorage
    const initAuth = async () => {
      const userData = AuthService.getCurrentUser();
      
      if (userData) {
        try {
          // Verify the token is still valid
          const checkResult = await AuthService.checkAuth();
          
          if (checkResult.authenticated) {
            setCurrentUser(new UserModel(userData));
          } else {
            // Token invalid, clear it
            AuthService.logout();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await AuthService.login(username, password);
      setCurrentUser(new UserModel(data));
      message.success('Login successful');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    message.info('You have been logged out');
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
