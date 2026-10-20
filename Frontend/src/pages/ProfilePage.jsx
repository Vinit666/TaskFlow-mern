import React, { useState, useRef, useEffect } from 'react';
import { useAuth, formatDuration } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { getAvatarUrl } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import {
  Camera,
  User,
  Mail,
  AlertCircle,
  Check,
  Clock,
  Activity,
  LogIn,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  X,
  History,
  Monitor
} from 'lucide-react';

export const ProfilePage = ({ onNavigateBack }) => {
  const { user, updateUser, sessionSeconds = 0 } = useAuth();
  const { showToast } = useToast();

  const [liveSeconds, setLiveSeconds] = useState(sessionSeconds);

  useEffect(() => {
    setLiveSeconds(sessionSeconds);
    const timer = setInterval(() => {
      setLiveSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionSeconds]);

  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize inputs from current user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarFile(null);
      setPreviewUrl(user.avatar ? getAvatarUrl(user.avatar) : null);
      setError('');
    }
  }, [user]);

  // Cleanup object URLs on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // File format validation
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, GIF).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 5 MB file size limit validation
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`Photo size (${actualSizeMB} MB) exceeds the 5 MB limit. Please select a smaller photo.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Generate local preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelNewPhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setAvatarFile(null);
    setPreviewUrl(user?.avatar ? getAvatarUrl(user.avatar) : null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name cannot exceed 50 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.updateProfile({
        name: trimmedName,
        avatarFile: avatarFile || undefined
      });

      if (response?.user) {
        updateUser(response.user);
      } else {
        updateUser({ name: trimmedName });
      }

      setAvatarFile(null);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute total accumulated session duration
  const totalAccumulatedSeconds = (user?.totalSessionTime || 0) + liveSeconds;

  // Build sessions list ensuring current active session is prioritized
  const currentSessionId = localStorage.getItem('taskflow_auth_session_id');
  const storedSessions = user?.sessions && Array.isArray(user.sessions) ? user.sessions : [];

  let sessionsList = [...storedSessions];
  if (sessionsList.length === 0) {
    // Fallback if user just registered or sessions array is initializing
    sessionsList = [
      {
        sessionId: currentSessionId || 'current-active',
        loginAt: user?.lastLoginAt || new Date().toISOString(),
        logoutAt: null,
        durationSeconds: liveSeconds,
        ipAddress: '127.0.0.1 (Current)',
        userAgent: navigator.userAgent || 'Current Browser',
        isActive: true
      }
    ];
  }

  // Format date helper
  const formatDateTime = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(dateVal);
    }
  };

  // Format last login timestamp into date and time parts
  const formatLastLogin = (dateVal) => {
    if (!dateVal) return { date: 'Current Active', time: null };
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return { date: 'Current Active', time: null };
      return {
        date: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (e) {
      return { date: String(dateVal), time: null };
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      {/* Top Header & Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onNavigateBack}
          className="btn btn-ghost btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-sm)'
          }}
          id="btn-back-workspace"
        >
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Account Profile & Sessions
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Manage profile details and view session activity.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="profile-page-grid">
        {/* Left Column: Edit Profile & Photo */}
        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <User size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Personal Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Error Notification Alert */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.8125rem'
                }}
                role="alert"
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Avatar with Edit Button Directly On Image */}
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={user?.name || 'Profile'}
                    className="profile-avatar-img"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {user?.name ? user.name.charAt(0) : <User size={48} />}
                  </div>
                )}

                {/* Edit Button Directly On Image */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="profile-avatar-edit-btn"
                  title="Upload profile photo (< 5MB)"
                  aria-label="Upload profile photo"
                  id="btn-edit-avatar-badge"
                >
                  <Camera size={18} />
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  id="profile-avatar-file-input"
                />
              </div>

              {/* Status and Action for New Selected Photo */}
              {avatarFile ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#34d399',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    New photo selected ({(avatarFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelNewPhoto}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      color: '#f87171',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Cancel selected photo"
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    marginTop: '0.5rem'
                  }}
                >
                  <span>Max 5 MB • JPG, PNG, WebP</span>
                </div>
              )}
            </div>

            {/* Full Name Input Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label htmlFor="input-profile-name" className="form-label" style={{ margin: 0 }}>
                  Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2–50 characters</span>
              </div>
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                maxLength={50}
                icon={User}
                id="input-profile-name"
              />
            </div>

            {/* Email Address (Read-only) with Clean Hover Tooltip */}
            <div title="Primary registered login email cannot be changed.">
              <Input
                label="Email Address (Registered)"
                name="email"
                type="email"
                value={user?.email || ''}
                disabled
                icon={Mail}
                id="input-profile-email"
                title="Primary registered login email cannot be changed."
              />
            </div>

            {/* Account Creation Date */}
            {user?.createdAt && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Member Since</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {formatDateTime(user.createdAt)}
                </span>
              </div>
            )}

            {/* Submit Save Button */}
            <div style={{ marginTop: '0.75rem' }}>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                style={{ width: '100%', justifyContent: 'center' }}
                id="btn-save-profile-page"
              >
                <Check size={16} style={{ marginRight: '6px' }} />
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Sessions Overview & Detailed Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Key Stat Cards Grid */}
          <div className="session-stat-grid">
            {/* Card 1: Total Time Logged In */}
            <div
              className="session-card-stat"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderColor: 'rgba(99, 102, 241, 0.22)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                <Clock size={16} color="#818cf8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.025em', whiteSpace: 'nowrap' }}>
                  Total Time Logged In
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {formatDuration(totalAccumulatedSeconds)}
              </div>
            </div>

            {/* Card 2: Current Active Session */}
            <div
              className="session-card-stat"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderColor: 'rgba(99, 102, 241, 0.22)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                <Activity size={16} color="#818cf8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.025em', whiteSpace: 'nowrap' }}>
                  Current Active Session
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {formatDuration(liveSeconds)}
              </div>
            </div>

            {/* Card 3: Total Account Logins */}
            <div
              className="session-card-stat"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderColor: 'rgba(99, 102, 241, 0.22)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                <LogIn size={16} color="#818cf8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.025em', whiteSpace: 'nowrap' }}>
                  Total Account Logins
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {user?.loginCount || sessionsList.length} {(user?.loginCount || sessionsList.length) === 1 ? 'login' : 'logins'}
              </div>
            </div>

            {/* Card 4: Last Login Timestamp */}
            <div
              className="session-card-stat"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderColor: 'rgba(99, 102, 241, 0.22)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                <Calendar size={16} color="#818cf8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.025em', whiteSpace: 'nowrap' }}>
                  Last Login Time
                </span>
              </div>
              {(() => {
                const lastLogin = formatLastLogin(user?.lastLoginAt);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {lastLogin.date}
                    </div>
                    {lastLogin.time && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                        {lastLogin.time}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Session History Table Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--primary)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  All Recorded Login Sessions
                </h2>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Showing {sessionsList.length} session {sessionsList.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Responsive Table of Session Entries */}
            <div className="session-table-container">
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Started Time</th>
                    <th>Ended Time</th>
                    <th>Session Duration</th>
                    <th>Network & Device</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsList.map((s, index) => {
                    const isCurrent = Boolean(s.isActive && (currentSessionId ? s.sessionId === currentSessionId : index === 0));
                    const historicalFallback =
                      !isCurrent && (!s.durationSeconds || s.durationSeconds === 0) && s.logoutAt && s.loginAt
                        ? Math.max(0, Math.floor((new Date(s.logoutAt).getTime() - new Date(s.loginAt).getTime()) / 1000))
                        : (s.durationSeconds || 0);

                    const durationVal = isCurrent
                      ? Math.max(liveSeconds, s.durationSeconds || 0)
                      : historicalFallback;

                    return (
                      <tr key={s.sessionId || index}>
                        {/* Status badge */}
                        <td>
                          {isCurrent ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#34d399'
                                }}
                              />
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.25rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(148, 163, 184, 0.12)',
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              Completed
                            </span>
                          )}
                        </td>

                        {/* Started Time */}
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(s.loginAt)}
                        </td>

                        {/* Ended Time */}
                        <td style={{ color: isCurrent ? '#34d399' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {isCurrent ? (
                            <span style={{ fontStyle: 'italic', fontSize: '0.8125rem' }}>Ongoing (Now)</span>
                          ) : s.logoutAt ? (
                            formatDateTime(s.logoutAt)
                          ) : (
                            formatDateTime(new Date(new Date(s.loginAt).getTime() + (s.durationSeconds || 0) * 1000))
                          )}
                        </td>

                        {/* Session Duration */}
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: isCurrent ? '#34d399' : 'var(--text-primary)'
                            }}
                          >
                            {formatDuration(durationVal)}
                          </span>
                        </td>

                        {/* Network / Device */}
                        <td style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Monitor size={14} style={{ flexShrink: 0 }} />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={s.userAgent || s.ipAddress || 'Standard Web Browser'}
                            >
                              {s.ipAddress ? `${s.ipAddress} • ` : ''}
                              {s.userAgent
                                ? s.userAgent.includes('Chrome')
                                  ? 'Chrome Browser'
                                  : s.userAgent.includes('Firefox')
                                  ? 'Firefox Browser'
                                  : s.userAgent.includes('Safari')
                                  ? 'Safari Browser'
                                  : 'Web Browser'
                                : 'Web Browser'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
