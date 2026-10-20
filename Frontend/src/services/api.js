/**
 * Unified API Client for Frontend
 * Handles automatic JWT injection, response normalization, and 401 token expiration handling.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const NETWORK_ERROR_MESSAGE = 'Network connection error. Please check your internet connection and try again.';

const isNetworkRelatedError = (msg = '') => {
  const lower = String(msg).toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('load failed') ||
    lower.includes('enotfound') ||
    lower.includes('getaddrinfo') ||
    lower.includes('econnrefused') ||
    lower.includes('mongodb.net') ||
    lower.includes('server selection timed out') ||
    lower.includes('topology was destroyed') ||
    lower.includes('mongonetworkerror') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout')
  );
};

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
 * Helper to resolve avatar image URL
 * @param {string} avatarPath
 * @returns {string|null}
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  return avatarPath;
};

/**
 * Generic Fetch Wrapper with interceptor capabilities
 * @param {string} endpoint - API path e.g. '/tasks'
 * @param {Object} options - Fetch options
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      // Avoid infinite loop if calling login or register, and never allow background heartbeats to log the user out
      if (
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !endpoint.includes('/auth/session-heartbeat')
      ) {
        clearStoredToken();
        window.dispatchEvent(
          new CustomEvent('auth:expired', {
            detail: { message: data?.message || 'Your session has expired. Please log in again.' }
          })
        );
      }
    }

    if (!response.ok) {
      let errorMsg = data?.message || data?.errors?.[0] || `Request failed with status ${response.status}`;
      if (response.status === 503 || isNetworkRelatedError(errorMsg)) {
        errorMsg = NETWORK_ERROR_MESSAGE;
      }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      error.name === 'TypeError' ||
      isNetworkRelatedError(error.message)
    ) {
      const netError = new Error(NETWORK_ERROR_MESSAGE);
      netError.status = error.status || 503;
      netError.isNetworkError = true;
      netError.data = error.data;
      throw netError;
    }
    throw error;
  }
};

export default apiClient;
