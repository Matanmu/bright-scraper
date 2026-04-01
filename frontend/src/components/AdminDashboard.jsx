import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function ResultsTable({ results }) {
  if (!results || results.length === 0) return <p className="admin-no-results">No results.</p>;
  const keys = Object.keys(results[0]);
  return (
    <div className="admin-results-wrap">
      <table className="admin-results-table">
        <thead>
          <tr>{keys.map((k) => <th key={k}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {results.map((row, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>
                  {typeof row[k] === 'string' && row[k].startsWith('http')
                    ? <a href={row[k]} target="_blank" rel="noreferrer">{row[k]}</a>
                    : String(row[k] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserDetail({ user, onBack }) {
  const [expandedScrape, setExpandedScrape] = useState(null);

  return (
    <div className="admin-detail">
      <button className="admin-back-btn" onClick={onBack}>
        ← Back to users
      </button>

      <div className="admin-detail-header">
        <div className="admin-detail-avatar">{user.email[0].toUpperCase()}</div>
        <div>
          <h2 className="admin-detail-email">{user.email}</h2>
          <div className="admin-detail-meta">
            <span className={`admin-badge admin-badge--${user.email_verified ? 'registered' : 'unverified'}`}>
              {user.email_verified ? 'Verified' : 'Unverified'}
            </span>
            <span className="admin-detail-joined">
              Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </span>
            <span className="admin-detail-joined">{user.scrapeCount} scrape{user.scrapeCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Scrape History</h3>
        </div>

        {user.scrapes.length === 0 ? (
          <div className="admin-table-empty" style={{ padding: '32px 24px' }}>No scrapes yet.</div>
        ) : (
          user.scrapes.map((s, i) => (
            <div key={i} className="admin-scrape-item">
              <div
                className="admin-scrape-header"
                onClick={() => setExpandedScrape(expandedScrape === i ? null : i)}
              >
                <div className="admin-scrape-info">
                  <span className="admin-scrape-prompt-text">{s.prompt}</span>
                  <span className="admin-scrape-meta">
                    {s.resultCount} result{s.resultCount !== 1 ? 's' : ''}
                    {s.timestamp && ` · ${new Date(s.timestamp).toLocaleString()}`}
                  </span>
                </div>
                <span className="admin-scrape-toggle">{expandedScrape === i ? '▲' : '▼'}</span>
              </div>
              {expandedScrape === i && (
                <div className="admin-scrape-results">
                  <ResultsTable results={s.results} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/admin/stats`, { headers }),
      axios.get(`${API_URL}/api/admin/users`, { headers }),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data.users);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load admin data.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return <div className="admin-page"><div className="admin-loading">Loading...</div></div>;
  if (error) return <div className="admin-page"><div className="admin-error">{error}</div></div>;

  if (selectedUser) {
    return (
      <div className="admin-page">
        <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    );
  }

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.userCount}</span>
            <span className="admin-stat-label">Registered Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.totalScrapes}</span>
            <span className="admin-stat-label">Total Scrapes</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.chatCount}</span>
            <span className="admin-stat-label">Chat Sessions</span>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Users</h2>
          <input
            className="admin-search"
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Scrapes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="admin-table-empty">No users found.</td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="admin-table-row admin-table-row--clickable" onClick={() => setSelectedUser(u)}>
                <td className="admin-email">
                  <div className="admin-email-avatar">{u.email[0].toUpperCase()}</div>
                  {u.email}
                </td>
                <td>
                  <span className={`admin-badge admin-badge--${u.email_verified ? 'registered' : 'unverified'}`}>
                    {u.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="admin-date">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="admin-count">{u.scrapeCount}</td>
                <td className="admin-arrow">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
