import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../pages/ProfilePage';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
  default: {
    updateProfile: vi.fn()
  }
}));

const mockUser = {
  id: 'user123',
  name: 'Alex Developer',
  email: 'alex@example.com',
  avatar: '',
  loginCount: 5,
  lastLoginAt: '2026-10-19T10:00:00.000Z',
  totalSessionTime: 3600,
  createdAt: '2026-01-01T00:00:00.000Z',
  sessions: [
    {
      sessionId: 'sess-1',
      loginAt: '2026-10-19T10:00:00.000Z',
      logoutAt: '2026-10-19T11:00:00.000Z',
      durationSeconds: 3600,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
      isActive: false
    }
  ]
};

const renderProfilePage = (customUser = mockUser, onNavigateBack = vi.fn()) => {
  const authContextValue = {
    user: customUser,
    updateUser: vi.fn(),
    isAuthenticated: true,
    loading: false,
    sessionSeconds: 120
  };

  return {
    ...render(
      <ToastProvider>
        <AuthContext.Provider value={authContextValue}>
          <ProfilePage onNavigateBack={onNavigateBack} />
        </AuthContext.Provider>
      </ToastProvider>
    ),
    authContextValue
  };
};

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders complete profile page with title, inputs, and session cards', () => {
    renderProfilePage();

    expect(screen.getByText('Account Profile & Sessions')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alex Developer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Total Time Logged In/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Active Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Account Logins/i)).toBeInTheDocument();
  });

  it('provides an edit button directly on the avatar that triggers file upload', () => {
    renderProfilePage();

    const editBadgeBtn = document.getElementById('btn-edit-avatar-badge');
    expect(editBadgeBtn).toBeInTheDocument();

    const fileInput = document.getElementById('profile-avatar-file-input');
    expect(fileInput).toBeInTheDocument();

    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(editBadgeBtn);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('enforces 5MB file size limit and displays alert for oversized files', async () => {
    renderProfilePage();

    const fileInput = document.getElementById('profile-avatar-file-input');

    // Create a 6MB mock file
    const largeFile = new File(['x'], 'huge-photo.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/exceeds the 5 MB limit/i);
    });
  });

  it('saves name update when submitting the profile form', async () => {
    authService.updateProfile.mockResolvedValueOnce({
      user: { ...mockUser, name: 'Alex Updated' }
    });

    const { authContextValue } = renderProfilePage();

    const nameInput = screen.getByDisplayValue('Alex Developer');
    fireEvent.change(nameInput, { target: { value: 'Alex Updated' } });

    const saveBtn = document.getElementById('btn-save-profile-page');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alex Updated' })
      );
      expect(authContextValue.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alex Updated' })
      );
    });
  });

  it('renders all session entries with started time, ended time, duration and network info', () => {
    renderProfilePage();

    expect(screen.getByText('All Recorded Login Sessions')).toBeInTheDocument();
    expect(screen.getByText('Started Time')).toBeInTheDocument();
    expect(screen.getByText('Ended Time')).toBeInTheDocument();
    expect(screen.getByText('Session Duration')).toBeInTheDocument();
    expect(screen.getByText(/192.168.1.1/)).toBeInTheDocument();
  });

  it('calls onNavigateBack when clicking Back to Workspace button', () => {
    const handleBack = vi.fn();
    renderProfilePage(mockUser, handleBack);

    const backBtn = document.getElementById('btn-back-workspace');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
