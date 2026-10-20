import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth, formatDuration } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import { getAvatarUrl } from '../../services/api';
import {
  Camera,
  User,
  Mail,
  AlertCircle,
  Trash2,
  Check,
  Clock,
  Activity,
  LogIn,
  Calendar,
  Monitor,
  ShieldCheck,
  History
} from 'lucide-react';

export const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser, sessionSeconds = 0 } = useAuth();
  const { showToast } = useToast();

  const [liveSeconds, setLiveSeconds] = useState(sessionSeconds);

  useEffect(() => {
    if (!isOpen) return;
    setLiveSeconds(sessionSeconds);
    const timer = setInterval(() => {
      setLiveSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, sessionSeconds]);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'activity'
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync with current user info whenever modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setAvatarFile(null);
      setPreviewUrl(user.avatar ? getAvatarUrl(user.avatar) : null);
      setError('');
    }
  }, [isOpen, user]);

  // Clean up object URL when component unmounts or preview changes
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

    // File type validation
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, GIF).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 5 MB file size validation
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`Photo size (${actualSizeMB} MB) exceeds the 5 MB limit. Please select a smaller image.`);
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

  const handleRemovePhoto = () => {
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
      const updatedUser = await authService.updateProfile({
        name: trimmedName,
        avatarFile: avatarFile || undefined
      });

      updateUser(updatedUser);
      showToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalTimeSeconds = (user?.totalSessionTime || 0) + (liveSeconds || 0);
  const sessionsList = user?.sessions || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile & Account" maxWidth="560px">
      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          paddingBottom: '0.25rem'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all var(--transition-fast)'
          }}
          id="tab-profile-settings"
        >
          <User size={16} />
          <span>Edit Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'activity' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'activity' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all var(--transition-fast)'
          }}
          id="tab-session-activity"
        >
          <Activity size={16} />
          <span>Sessions & Login Time</span>
          <span
            style={{
              fontSize: '0.7rem',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '1px 6px',
              borderRadius: '9999px',
              fontWeight: 700
            }}
          >
            Live
          </span>
        </button>
      </div>

      {/* Tab 1: Edit Profile (Photo Upload & Name) */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                color: '#f87171',
                fontSize: '0.875rem',
                marginBottom: '1.25rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar Upload Area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '1.5rem',
              padding: '1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)'
            }}
          >
            <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
                  border: '2px solid rgba(99, 102, 241, 0.5)',
                  fontSize: '2rem',
                  fontWeight: 700
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={name || 'User avatar'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={() => setPreviewUrl(null)}
                  />
                ) : name ? (
                  name.charAt(0).toUpperCase()
                ) : (
                  <User size={36} />
                )}
              </div>

              {/* Camera Trigger Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: '2px solid #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }}
                title="Upload profile photo"
                aria-label="Upload profile photo"
              >
                <Camera size={15} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="avatar-file-input"
            />

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}
              >
                <Camera size={14} style={{ marginRight: '4px' }} />
                Choose Photo
              </button>

              {avatarFile && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8125rem', color: '#f87171', padding: '0.35rem 0.5rem' }}
                  title="Discard new photo selection"
                >
                  <Trash2 size={14} style={{ marginRight: '4px' }} />
                  Cancel Selection
                </button>
              )}
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '0.5rem',
                textAlign: 'center'
              }}
            >
              Allowed: JPG, PNG, WebP, GIF • <strong>Max 5 MB</strong>
            </span>
          </div>

          {/* Full Name Input */}
          <Input
            label="Full Name"
            id="profile-name"
            name="name"
            type="text"
            icon={User}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Your full name"
            required
            autoComplete="name"
          />

          {/* Email Address (Read-only) */}
          <Input
            label="Email Address (Registered)"
            id="profile-email"
            name="email"
            type="email"
            icon={Mail}
            value={user?.email || ''}
            disabled
            helperText="Email address cannot be changed."
          />

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              id="btn-save-profile"
            >
              <Check size={16} style={{ marginRight: '6px' }} />
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Sessions & Login Time Tracking */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Key Stat Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.875rem'
            }}
          >
            {/* Card 1: Total Time Logged In */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Clock size={16} color="#818cf8" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase' }}>
                  Total Time Logged In
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatDuration(totalTimeSeconds)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Persisted & stored in MongoDB
              </div>
            </div>

            {/* Card 2: Current Active Session */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Activity size={16} color="#34d399" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>
                  Current Active Session
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                {formatDuration(liveSeconds)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                🟢 Real-time ticking counter
              </div>
            </div>

            {/* Card 3: Total Login Count */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <LogIn size={16} color="#fbbf24" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase' }}>
                  Total Account Logins
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {user?.loginCount || 1} {user?.loginCount === 1 ? 'time' : 'times'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tracked across all devices
              </div>
            </div>

            {/* Card 4: Last Sign-in Timestamp */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid rgba(148, 163, 184, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Calendar size={16} color="#94a3b8" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Last Login
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Current Session'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Latest authenticated session
              </div>
            </div>
          </div>

          {/* Recent Sessions Log */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <History size={16} color="var(--primary)" />
              <span>Recent Session History (Recorded in Database)</span>
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                paddingRight: '4px'
              }}
            >
              {sessionsList.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '0.5rem' }}>
                  No previous sessions recorded.
                </div>
              ) : (
                sessionsList.map((session, idx) => (
                  <div
                    key={session.sessionId || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <Monitor size={15} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(session.loginAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {session.ipAddress ? `IP: ${session.ipAddress} • ` : ''}
                          Duration:{' '}
                          {formatDuration(
                            session.isActive
                              ? Math.max(liveSeconds, session.durationSeconds || 0)
                              : (!session.durationSeconds || session.durationSeconds === 0) && session.logoutAt && session.loginAt
                              ? Math.max(0, Math.floor((new Date(session.logoutAt).getTime() - new Date(session.loginAt).getTime()) / 1000))
                              : session.durationSeconds || 0
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {session.isActive ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 600
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
                            backgroundColor: 'rgba(148, 163, 184, 0.1)',
                            color: 'var(--text-muted)',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem'
                          }}
                        >
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Close Action */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <Button type="button" variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditProfileModal;
