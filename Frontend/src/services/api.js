/**
 * Unified API Client for Frontend
 * Handles automatic JWT injection, response normalization, and 401 token expiration handling.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const getStoredToken = () => {
  return localStorage.getItem('taskflow_auth_token');
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('taskflow_auth_token', token);
  } else {
    localStorage.removeItem('taskflow_auth_token');
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem('taskflow_auth_token');
  localStorage.removeItem('taskflow_auth_user');
};

/**
 * Generic Fetch Wrapper with interceptor capabilities
 * @param {string} endpoint - API path e.g. '/tasks'
 * @param {Object} options - Fetch options
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Parse JSON response safely
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Handle 401 Unauthorized (JWT expiration / invalid token)
    if (response.status === 401) {
      // Avoid infinite loop if calling login or register
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        clearStoredToken();
        window.dispatchEvent(
          new CustomEvent('auth:expired', {
            detail: { message: data?.message || 'Your session has expired. Please log in again.' }
          })
        );
      }
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.errors?.[0] || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
