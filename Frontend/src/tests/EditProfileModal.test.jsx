import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditProfileModal from '../components/profile/EditProfileModal';
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
  avatar: ''
};

const renderEditProfileModal = (customUser = mockUser, onClose = vi.fn()) => {
  const authContextValue = {
    user: customUser,
    updateUser: vi.fn(),
    isAuthenticated: true,
    loading: false
  };

  return render(
    <ToastProvider>
      <AuthContext.Provider value={authContextValue}>
        <EditProfileModal isOpen={true} onClose={onClose} />
      </AuthContext.Provider>
    </ToastProvider>
  );
};

describe('EditProfileModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with user details and 5MB limit hint', () => {
    renderEditProfileModal();

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alex Developer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Max 5 MB/i)).toBeInTheDocument();
  });

  it('rejects photo upload if file size exceeds 5MB', async () => {
    renderEditProfileModal();

    const fileInput = document.getElementById('avatar-file-input');
    expect(fileInput).toBeInTheDocument();

    // Create fake 6 MB file
    const largeFile = new File(['x'.repeat(1024)], 'large-photo.png', {
      type: 'image/png'
    });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/exceeds the 5 MB limit. Please select a smaller image/i)
      ).toBeInTheDocument();
    });
  });

  it('validates name length when submitting', async () => {
    renderEditProfileModal();

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters long/i)).toBeInTheDocument();
    });
  });

  it('calls authService.updateProfile when valid changes are submitted', async () => {
    authService.updateProfile.mockResolvedValueOnce({
      id: 'user123',
      name: 'Alex Senior Developer',
      email: 'alex@example.com',
      avatar: ''
    });

    const onClose = vi.fn();
    renderEditProfileModal(mockUser, onClose);

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Alex Senior Developer' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith({
        name: 'Alex Senior Developer',
        avatarFile: undefined
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders session statistics and login count when activity tab is active', async () => {
    const userWithSessions = {
      ...mockUser,
      loginCount: 5,
      totalSessionTime: 3600, // 1 hour
      sessions: [
        {
          sessionId: 'sess-1',
          loginAt: new Date().toISOString(),
          isActive: true,
          durationSeconds: 120,
          ipAddress: '127.0.0.1'
        }
      ]
    };

    renderEditProfileModal(userWithSessions);

    const activityTabBtn = screen.getByRole('button', { name: /Sessions & Login Time/i });
    fireEvent.click(activityTabBtn);

    expect(screen.getByText(/Total Time Logged In/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Account Logins/i)).toBeInTheDocument();
    expect(screen.getByText(/5 times/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Active Session/i)).toBeInTheDocument();
  });
});
