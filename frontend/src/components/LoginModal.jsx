import { useState } from 'react';
import axios from 'axios';
import './LoginModal.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      const { token, user } = res.data;
      onSuccess(token, user);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
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

        <h2 className="modal-title">{mode === 'login' ? 'Sign in to Bright-Scraper' : 'Create your account'}</h2>
        <p className="modal-subtitle">
          Save your scraping history and access it from anywhere.
        </p>

        <form className="modal-email-form" onSubmit={handleSubmit}>
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
          {error && <p className="modal-error">{error}</p>}
          <button type="submit" className="btn-email-submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="modal-toggle">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className="modal-note">
          Guest users can still scrape — results just won't be saved.
        </p>
      </div>
    </div>
  );
}
