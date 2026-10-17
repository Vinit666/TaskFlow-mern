import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Wrap helper
const renderLoginPage = (onNavigateRegister = vi.fn()) => {
  return render(
    <ToastProvider>
      <AuthProvider>
        <LoginPage onNavigateRegister={onNavigateRegister} />
      </AuthProvider>
    </ToastProvider>
  );
};

describe('LoginPage Component', () => {
  it('renders email, password inputs, and submit button', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays validation errors when submitting empty form', async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('updates email and password fields when user types', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });

    expect(emailInput.value).toBe('user@example.com');
    expect(passwordInput.value).toBe('Secret123!');
  });
});
