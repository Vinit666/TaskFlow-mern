import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { getStoredToken, clearStoredToken } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load user profile on initial startup if token exists
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const profile = await authService.getMe();
        if (isMounted) {
          setUser(profile);
          setToken(storedToken);
        }
      } catch (err) {
        // If token is invalid or expired
        clearStoredToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for global JWT expiration events dispatched by API client
    const handleAuthExpired = (event) => {
      setUser(null);
      setToken(null);
      showToast(event.detail?.message || 'Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [showToast]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register({ name, email, password });
    setUser(data.user);
    setToken(data.token);
    showToast(`Account created successfully! Welcome, ${data.user.name}.`, 'success');
    return data;
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      showToast('Logged out successfully.', 'info');
    }
  }, [showToast]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
