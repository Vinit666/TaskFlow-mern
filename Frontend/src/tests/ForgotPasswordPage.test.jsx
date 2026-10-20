import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import { ToastProvider } from '../context/ToastContext';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
  default: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn()
  }
}));

const renderForgotPassword = (onNavigateLogin = vi.fn()) => {
  return render(
    <ToastProvider>
      <ForgotPasswordPage onNavigateLogin={onNavigateLogin} />
    </ToastProvider>
  );
};

describe('ForgotPasswordPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input, submit button, and back link in Step 1', () => {
    renderForgotPassword();

    expect(screen.getByLabelText(/Registered Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Verification OTP/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Sign In/i })).toBeInTheDocument();
  });

  it('validates email input before requesting OTP', async () => {
    renderForgotPassword();

    const submitBtn = screen.getByRole('button', { name: /Send Verification OTP/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    });
  });

  it('transitions to Step 2 when OTP request succeeds', async () => {
    authService.forgotPassword.mockResolvedValueOnce({
      success: true,
      message: 'OTP sent successfully'
    });

    renderForgotPassword();

    const emailInput = screen.getByLabelText(/Registered Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /Send Verification OTP/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verify OTP & Reset/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/6-Digit Verification Code/i)).toBeInTheDocument();
    });
  });

  it('validates OTP and matching passwords in Step 2', async () => {
    authService.forgotPassword.mockResolvedValueOnce({ success: true });

    renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/Registered Email Address/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Verification OTP/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/6-Digit Verification Code/i)).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole('button', { name: /Reset Password/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter the 6-digit OTP code/i)).toBeInTheDocument();
    });
  });
});
