import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { getStoredToken, clearStoredToken } from '../services/api';
import { useToast } from './ToastContext';

export const AuthContext = createContext(null);

/**
 * Formats seconds into a human-readable duration string (e.g. 1h 24m 10s)
 */
export const formatDuration = (totalSeconds = 0) => {
  if (!totalSeconds || totalSeconds < 0) return '0s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

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
        const currentSessionId = localStorage.getItem('taskflow_auth_session_id');
        if (currentSessionId) {
          authService.resumeSession(currentSessionId);
        }

        const profile = await authService.getMe();
        if (isMounted) {
          setUser(profile);
          setToken(storedToken);

          // Find the genuinely active session in MongoDB
          // 1. Try matching currentSessionId ONLY IF it is still active (page refresh case)
          // 2. Otherwise find any active session created by backend (new session on restored tab / new visit)
          const matchingActiveSession = currentSessionId
            ? profile?.sessions?.find((s) => s.sessionId === currentSessionId && s.isActive)
            : null;

          const activeSession =
            matchingActiveSession ||
            profile?.sessions?.find((s) => s.isActive) ||
            profile?.sessions?.[0];

          if (activeSession) {
            // Update current session ID in localStorage to the active one
            localStorage.setItem('taskflow_auth_session_id', activeSession.sessionId);

            // If the old session was closed (e.g. restored tab after grace period), discard stale sessionStorage
            if (!matchingActiveSession) {
              sessionStorage.removeItem('taskflow_session_start');
            }

            if (activeSession.loginAt) {
              const loginTimestamp = new Date(activeSession.loginAt).getTime();
              sessionStorage.setItem('taskflow_session_start', String(loginTimestamp));
              setSessionStartTime(loginTimestamp);
            }
          }
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

    // Listen for page restoration from bfcache (Ctrl+Shift+T, back/forward cache, tab restore)
    const handlePageRestore = (event) => {
      if (event?.persisted || document.visibilityState === 'visible') {
        initializeAuth();
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('pageshow', handlePageRestore);
    document.addEventListener('visibilitychange', handlePageRestore);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('pageshow', handlePageRestore);
      document.removeEventListener('visibilitychange', handlePageRestore);
    };
  }, [showToast]);

  const getSessionStartTime = () => {
    let startStr = sessionStorage.getItem('taskflow_session_start');
    if (!startStr) {
      const now = Date.now();
      sessionStorage.setItem('taskflow_session_start', String(now));
      return now;
    }
    return parseInt(startStr, 10);
  };

  const [sessionStartTime, setSessionStartTime] = useState(() => {
    return getStoredToken() ? getSessionStartTime() : null;
  });

  const sessionSeconds = sessionStartTime
    ? Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000))
    : 0;

  // Periodic background heartbeat (every 30s) to keep MongoDB duration synchronized
  useEffect(() => {
    if (!token || !user) return;
    const currentSessionId = localStorage.getItem('taskflow_auth_session_id');
    if (!currentSessionId) return;

    const interval = setInterval(() => {
      const start =
        sessionStartTime ||
        (sessionStorage.getItem('taskflow_session_start')
          ? parseInt(sessionStorage.getItem('taskflow_session_start'), 10)
          : null);
      if (start) {
        const durationSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
        authService.syncSession({
          sessionId: currentSessionId,
          durationSeconds,
          isClosing: false
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, user, sessionStartTime]);

  // Automatic reload on restoring a closed tab (Ctrl+Shift+T)
  useEffect(() => {
    const checkTabRestore = () => {
      const closedAt = sessionStorage.getItem('taskflow_tab_closed_at');
      if (closedAt) {
        sessionStorage.removeItem('taskflow_tab_closed_at');
        const elapsed = Date.now() - parseInt(closedAt, 10);
        // If tab was closed for more than 4s, the previous session is finalized in DB.
        // Automatically reload so the restored tab starts fresh without requiring manual F5.
        if (elapsed > 4000) {
          sessionStorage.removeItem('taskflow_session_start');
          if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined' && window.location?.reload) {
            window.location.reload();
            return true;
          }
        }
      }
      return false;
    };

    checkTabRestore();

    const handlePageShow = (event) => {
      if (event?.persisted) {
        checkTabRestore();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Window unload / refresh sync: schedules leave candidate
  // If page reloads, resumeSession cancels the leave timer. If tab closes, timer finalizes close in DB.
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('taskflow_tab_closed_at', String(Date.now()));
      const sessionId = localStorage.getItem('taskflow_auth_session_id');
      const startStr = sessionStorage.getItem('taskflow_session_start');
      if (sessionId && startStr) {
        const durationSeconds = Math.max(0, Math.floor((Date.now() - parseInt(startStr, 10)) / 1000));
        authService.leaveSession({
          sessionId,
          durationSeconds,
          leaveTime: Date.now()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    const now = Date.now();
    sessionStorage.setItem('taskflow_session_start', String(now));
    setSessionStartTime(now);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register({ name, email, password });
    setUser(data.user);
    setToken(data.token);
    const now = Date.now();
    sessionStorage.setItem('taskflow_session_start', String(now));
    setSessionStartTime(now);
    showToast(`Account created successfully! Welcome, ${data.user.name}.`, 'success');
    return data;
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      sessionStorage.removeItem('taskflow_session_start');
      setSessionStartTime(null);
      showToast('Logged out successfully.', 'info');
    }
  }, [showToast]);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('taskflow_auth_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      sessionSeconds,
      login,
      register,
      logout,
      updateUser
    }),
    [user, token, loading, sessionSeconds, logout, updateUser]
  );

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
