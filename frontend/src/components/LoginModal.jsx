import { useState } from 'react';
import axios from 'axios';
import './LoginModal.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function LoginModal({ onClose, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const switchMode = (next) => { setMode(next); setError(null); setSuccess(null); setCode(''); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!termsAccepted) { setError('You must accept the Terms of Use to register'); return; }
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, { email, password, termsAccepted });
      switchMode('verify');
    } catch (err) {
      const data = err.response?.data;
      if (data?.pendingVerification) { switchMode('verify'); return; }
      setError(data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify`, { email, code });
      onSuccess(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      onSuccess(res.data.token, res.data.user);
    } catch (err) {
      const data = err.response?.data;
      if (data?.pendingVerification) {
        setEmail(data.email || email);
        switchMode('verify');
        return;
      }
      setError(data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      switchMode('reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { email, code, password: newPassword });
      setSuccess('Password updated! You can now sign in.');
      setTimeout(() => switchMode('login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.88 5.76L20 10l-6.12 1.24L12 17l-1.88-5.76L4 10l6.12-1.24z"/>
            <path d="M5 3l.88 2.68L8 6.5l-2.12.82L5 10l-.88-2.68L2 6.5l2.12-.82z"/>
            <path d="M19 14l.88 2.68L22 17.5l-2.12.82L19 21l-.88-2.68L16 17.5l2.12-.82z"/>
          </svg>
        </div>

        {mode === 'verify' && (
          <>
            <h2 className="modal-title">Check your email</h2>
            <p className="modal-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
            </p>
            <form className="modal-email-form" onSubmit={handleVerify}>
              <input
                type="text"
                className="modal-input modal-input--code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
              />
              {error && <p className="modal-error">{error}</p>}
              <button type="submit" className="btn-email-submit" disabled={loading || code.length < 6}>
                {loading ? '…' : 'Verify email'}
              </button>
            </form>
            <p className="modal-toggle">
              Wrong email? <button onClick={() => switchMode('register')}>Go back</button>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h2 className="modal-title">Reset your password</h2>
            <p className="modal-subtitle">
              Enter your email and we'll send you a 6-digit reset code.
            </p>
            <form className="modal-email-form" onSubmit={handleForgot}>
              <input
                type="email"
                className="modal-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {error && <p className="modal-error">{error}</p>}
              <button type="submit" className="btn-email-submit" disabled={loading}>
                {loading ? '…' : 'Send reset code'}
              </button>
            </form>
            <p className="modal-toggle">
              Remembered it? <button onClick={() => switchMode('login')}>Sign in</button>
            </p>
          </>
        )}

        {mode === 'reset' && (
          <>
            <h2 className="modal-title">Enter new password</h2>
            <p className="modal-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it with your new password.
            </p>
            <form className="modal-email-form" onSubmit={handleReset}>
              <input
                type="text"
                className="modal-input modal-input--code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
              />
              <input
                type="password"
                className="modal-input"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {error && <p className="modal-error">{error}</p>}
              {success && <p className="modal-success">{success}</p>}
              <button type="submit" className="btn-email-submit" disabled={loading || code.length < 6 || !newPassword}>
                {loading ? '…' : 'Reset password'}
              </button>
            </form>
            <p className="modal-toggle">
              Didn't get the code? <button onClick={() => switchMode('forgot')}>Resend</button>
            </p>
          </>
        )}

        {(mode === 'login' || mode === 'register') && (
          <>
            <h2 className="modal-title">
              {mode === 'login' ? 'Sign in to Bright-Scraper' : 'Create your account'}
            </h2>
            <p className="modal-subtitle">
              Save your scraping history and access it from anywhere.
            </p>

            <form className="modal-email-form" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              <input
                type="email"
                className="modal-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <input
                type="password"
                className="modal-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'register' && (
                <label className="modal-terms-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noreferrer">Terms of Use</a>
                  </span>
                </label>
              )}
              {error && <p className="modal-error">{error}</p>}
              <button
                type="submit"
                className="btn-email-submit"
                disabled={loading || (mode === 'register' && !termsAccepted)}
              >
                {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {mode === 'login' && (
              <p className="modal-forgot">
                <button onClick={() => switchMode('forgot')}>Forgot password?</button>
              </p>
            )}

            <p className="modal-toggle">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <p className="modal-note">
              Guest users can still scrape — results just won't be saved.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
