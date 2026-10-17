import apiClient, { setStoredToken, clearStoredToken } from './api';

export const authService = {
  /**
   * Registers a new user account
   */
  register: async ({ name, email, password }) => {
    const res = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    if (res?.data?.token) {
      setStoredToken(res.data.token);
      localStorage.setItem('taskflow_auth_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  /**
   * Authenticates user credentials
   */
  login: async ({ email, password }) => {
    const res = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res?.data?.token) {
      setStoredToken(res.data.token);
      localStorage.setItem('taskflow_auth_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  /**
   * Retrieves profile of currently authenticated user
   */
  getMe: async () => {
    const res = await apiClient('/auth/me', {
      method: 'GET'
    });
    return res.data?.user;
  },

  /**
   * Logs out user and cleans up persisted tokens
   */
  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      clearStoredToken();
    }
  }
};

export default authService;
