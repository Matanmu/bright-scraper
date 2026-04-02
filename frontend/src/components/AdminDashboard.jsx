import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.scss';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

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
              Joined {user.created_at ? dateFormatter.format(new Date(user.created_at)) : '—'}
            </span>
            <span className="admin-detail-joined">{user.scrapeCount} scrape{user.scrapeCount !== 1 ? 's' : ''} · {user.scrapes.length} total interaction{user.scrapes.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Activity</h3>
        </div>

        {user.scrapes.length === 0 ? (
          <div className="admin-table-empty" style={{ padding: '32px 24px' }}>No activity yet.</div>
        ) : (
          user.scrapes.map((s, i) => (
            <div key={i} className="admin-scrape-item">
              <div
                className="admin-scrape-header"
                role="button"
                tabIndex={0}
                onClick={() => (s.type === 'scrape' || s.type === 'reply') && setExpandedScrape(expandedScrape === i ? null : i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') (s.type === 'scrape' || s.type === 'reply') && setExpandedScrape(expandedScrape === i ? null : i); }}
                style={s.type === 'prompt' ? { cursor: 'default' } : undefined}
              >
                <div className="admin-scrape-info">
                  <div className="admin-scrape-prompt-row">
                    <span className={`admin-type-badge admin-type-badge--${s.type}`}>
                      {s.type === 'scrape' ? 'Scrape' : s.type === 'reply' ? 'AI Reply' : 'Prompt'}
                    </span>
                    <span className="admin-scrape-prompt-text">{s.prompt || s.reply}</span>
                  </div>
                  <span className="admin-scrape-meta">
                    {s.type === 'scrape' && `${s.resultCount} result${s.resultCount !== 1 ? 's' : ''} · `}
                    {s.timestamp && dateTimeFormatter.format(new Date(s.timestamp))}
                  </span>
                </div>
                {(s.type === 'scrape' || s.type === 'reply') && (
                  <span className="admin-scrape-toggle">{expandedScrape === i ? '▲' : '▼'}</span>
                )}
              </div>
              {expandedScrape === i && s.type === 'scrape' && (
                <div className="admin-scrape-results">
                  <ResultsTable results={s.results} />
                </div>
              )}
              {expandedScrape === i && s.type === 'reply' && (
                <div className="admin-scrape-results">
                  <p className="admin-reply-prompt">User: {s.prompt}</p>
                  <p className="admin-reply-text">Claude: {s.reply}</p>
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
  const [guests, setGuests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/admin/stats`, { headers }),
      axios.get(`${API_URL}/api/admin/users`, { headers }),
      axios.get(`${API_URL}/api/admin/guests`, { headers }),
    ])
      .then(([statsRes, usersRes, guestsRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data.users);
        setGuests(guestsRes.data.guests);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load admin data.'))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line

  if (loading) return <div className="admin-page"><div className="admin-loading">Loading...</div></div>;
  if (error) return <div className="admin-page"><div className="admin-error">{error}</div></div>;

  if (selectedUser) {
    return (
      <div className="admin-page">
        <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    );
  }

  if (selectedGuest) {
    return (
      <div className="admin-page">
        <UserDetail user={selectedGuest} onBack={() => setSelectedGuest(null)} />
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
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.guestCount}</span>
            <span className="admin-stat-label">Guest Sessions</span>
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
              <tr
                key={u.id}
                className="admin-table-row admin-table-row--clickable"
                tabIndex={0}
                onClick={() => setSelectedUser(u)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedUser(u); }}
              >
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
                  {u.created_at ? dateFormatter.format(new Date(u.created_at)) : '—'}
                </td>
                <td className="admin-count">{u.scrapeCount}</td>
                <td className="admin-arrow">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-section" style={{ marginTop: 24 }}>
        <div className="admin-section-header">
          <h2 className="admin-section-title">Guests</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Guest ID</th>
              <th>First Seen</th>
              <th>Scrapes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 && (
              <tr><td colSpan={4} className="admin-table-empty">No guest activity yet.</td></tr>
            )}
            {guests.map((g) => (
              <tr
                key={g.guestId}
                className="admin-table-row admin-table-row--clickable"
                tabIndex={0}
                onClick={() => setSelectedGuest({ email: `Guest · ${g.guestId.slice(0, 8)}…`, email_verified: false, created_at: g.firstSeen, scrapeCount: g.scrapeCount, scrapes: g.scrapes })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedGuest({ email: `Guest · ${g.guestId.slice(0, 8)}…`, email_verified: false, created_at: g.firstSeen, scrapeCount: g.scrapeCount, scrapes: g.scrapes }); }}
              >
                <td className="admin-email">
                  <div className="admin-email-avatar" style={{ background: '#1e2130', color: '#9099b0' }}>?</div>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{g.guestId.slice(0, 16)}…</span>
                </td>
                <td className="admin-date">{g.firstSeen ? dateFormatter.format(new Date(g.firstSeen)) : '—'}</td>
                <td className="admin-count">{g.scrapeCount}</td>
                <td className="admin-arrow">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
