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
    if (res?.data?.sessionId) {
      localStorage.setItem('taskflow_auth_session_id', res.data.sessionId);
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
    if (res?.data?.sessionId) {
      localStorage.setItem('taskflow_auth_session_id', res.data.sessionId);
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
   * Syncs active session heartbeat and duration
   */
  syncSession: async ({ sessionId, durationSeconds, isClosing = false }) => {
    if (!sessionId) return null;
    return apiClient('/auth/session-heartbeat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, durationSeconds, isClosing })
    }).catch(() => {});
  },

  /**
   * Signals candidate session leave when window or tab unloads
   */
  leaveSession: ({ sessionId, durationSeconds, leaveTime }) => {
    if (!sessionId) return;
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
      fetch(`${BASE_URL}/auth/session-leave`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, durationSeconds, leaveTime })
      });
    } catch (e) {
      // non-blocking
    }
  },

  /**
   * Confirms page reload / resumes session to cancel leave timer
   */
  resumeSession: async (sessionId) => {
    if (!sessionId) return null;
    return apiClient('/auth/session-resume', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    }).catch(() => {});
  },

  /**
   * Logs out user and cleans up persisted tokens
   */
  logout: async () => {
    const sessionId = localStorage.getItem('taskflow_auth_session_id');
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    } finally {
      clearStoredToken();
      localStorage.removeItem('taskflow_auth_session_id');
      localStorage.removeItem('taskflow_auth_user');
    }
  },

  /**
   * Updates user profile (name and/or avatar photo file)
   */
  updateProfile: async ({ name, avatarFile }) => {
    let body;
    if (avatarFile) {
      body = new FormData();
      if (name) body.append('name', name);
      body.append('avatar', avatarFile);
    } else {
      body = JSON.stringify({ name });
    }

    const res = await apiClient('/auth/profile', {
      method: 'PUT',
      body
    });

    if (res?.data?.user) {
      const stored = localStorage.getItem('taskflow_auth_user');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem('taskflow_auth_user', JSON.stringify({ ...parsed, ...res.data.user }));
    }
    return res.data?.user;
  },

  /**
   * Initiates forgot password flow by requesting OTP
   */
  forgotPassword: async (email) => {
    return apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  /**
   * Verifies 6-digit OTP code
   */
  verifyOtp: async ({ email, otp }) => {
    return apiClient('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  },

  /**
   * Resets user password with verified OTP
   */
  resetPassword: async ({ email, otp, newPassword }) => {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
  }
};

export default authService;
