import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, LogOut, MoreVertical, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'all var(--transition-normal)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}
          >
            <CheckSquare size={20} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                display: 'block'
              }}
            >
              Task<span className="text-gradient">Flow</span>
            </span>
            <span className="brand-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '-3px' }}>
              Workflow & Task Manager
            </span>
          </div>
        </div>

        {/* Right Actions */}
        {isAuthenticated && user && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* User Profile Pill with 3-dot dropdown */}
            <div ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.35rem 0.6rem 0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.name}
                  </span>
                  <span
                    className="user-email-text"
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-secondary)',
                      maxWidth: '120px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </div>

                {/* 3-dot button to toggle profile menu */}
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{
                    padding: '4px',
                    borderRadius: '50%',
                    color: 'var(--text-secondary)',
                    marginLeft: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label="Profile options"
                  title="Profile options"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    minWidth: '210px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.65)',
                    padding: '0.5rem',
                    zIndex: 100,
                    animation: 'scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 0.625rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.625rem',
                      color: '#f87171',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    id="btn-logout"
                    title="Log out of application"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
