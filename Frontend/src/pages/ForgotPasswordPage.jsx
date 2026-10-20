import React, { useState, useEffect } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export const ForgotPasswordPage = ({ onNavigateLogin }) => {
  const { showToast } = useToast();

  const [step, setStep] = useState('request'); // 'request' | 'verify' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend cooldown timer
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = () => {
    const errs = {};
    if (!email || !email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const res = await authService.forgotPassword(email.trim());
      showToast(res?.message || 'Verification OTP code sent to your email!', 'info');
      setStep('verify');
      setCountdown(60); // 60s cooldown
    } catch (err) {
      setApiError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setApiError('');
    try {
      await authService.forgotPassword(email.trim());
      showToast('A new OTP code has been sent to your email.', 'info');
      setCountdown(60);
    } catch (err) {
      setApiError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateResetForm = () => {
    const errs = {};
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      errs.otp = 'Please enter the 6-digit OTP code.';
    } else if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      errs.otp = 'OTP code must be exactly 6 numeric digits.';
    }

    if (!newPassword || newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters long.';
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateResetForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });

      showToast(res?.message || 'Password reset successfully!', 'success');
      setStep('success');
    } catch (err) {
      setApiError(err.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div
        className="card auth-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        {/* Step 1: Request OTP */}
        {step === 'request' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  marginBottom: '1rem'
                }}
              >
                <KeyRound size={26} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Forgot Password</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                Enter your account email to receive a 6-digit OTP code via email.
              </p>
            </div>

            {apiError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-light)',
                  border: '1px solid var(--danger-border)',
                  color: '#f87171',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem'
                }}
              >
                {apiError}
              </div>
            )}

            <form onSubmit={handleRequestOtp} noValidate>
              <Input
                label="Registered Email Address"
                id="forgot-email"
                name="email"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  setApiError('');
                }}
                placeholder="you@example.com"
                error={errors.email}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}
                id="btn-send-otp"
              >
                Send Verification OTP
              </Button>
            </form>

            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center'
              }}
            >
              <button
                type="button"
                onClick={onNavigateLogin}
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}
                id="link-back-to-login"
              >
                <ArrowLeft size={16} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </>
        )}

        {/* Step 2: Enter OTP & New Password */}
        {step === 'verify' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                  marginBottom: '1rem'
                }}
              >
                <ShieldCheck size={28} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Verify OTP & Reset</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                We sent a 6-digit verification code to:
                <br />
                <strong style={{ color: 'var(--primary-hover)' }}>{email}</strong>
              </p>
            </div>

            {apiError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-light)',
                  border: '1px solid var(--danger-border)',
                  color: '#f87171',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem'
                }}
              >
                {apiError}
              </div>
            )}

            <form onSubmit={handleResetPassword} noValidate>
              {/* OTP Input Field */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label htmlFor="input-otp" className="form-label" style={{ margin: 0 }}>
                    6-Digit Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                      cursor: countdown > 0 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}
                    id="btn-resend-otp"
                  >
                    <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>

                <input
                  id="input-otp"
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                    setApiError('');
                  }}
                  className={`form-input ${errors.otp ? 'input-error' : ''}`}
                  style={{
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}
                  autoFocus
                />
                {errors.otp && <span className="form-error">{errors.otp}</span>}
              </div>

              {/* New Password */}
              <Input
                label="New Password"
                id="reset-new-password"
                name="newPassword"
                type="password"
                icon={Lock}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null }));
                  setApiError('');
                }}
                placeholder="At least 6 characters"
                error={errors.newPassword}
                required
                autoComplete="new-password"
              />

              {/* Confirm New Password */}
              <Input
                label="Confirm New Password"
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  setApiError('');
                }}
                placeholder="Re-enter your new password"
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                style={{ width: '100%', marginTop: '0.75rem', height: '44px' }}
                id="btn-confirm-reset"
              >
                Reset Password
              </Button>
            </form>

            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8125rem'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setApiError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change Email
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel & Sign In
              </button>
            </div>
          </>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Password Reset!
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                marginBottom: '2rem',
                lineHeight: 1.6
              }}
            >
              Your password has been successfully updated. You can now use your new password to sign into your TaskFlow account.
            </p>

            <Button
              type="button"
              variant="primary"
              onClick={onNavigateLogin}
              style={{ width: '100%', height: '44px' }}
              id="btn-success-to-login"
            >
              Proceed to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
