import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function ToggleOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.3 16H10.7C12.7 16 13.5 15.2 13.5 13.2V10.8C13.5 8.8 12.7 8 10.7 8H8.3C6.3 8 5.5 8.8 5.5 10.8V13.2C5.5 15.2 6.3 16 8.3 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 20H7C3 20 2 19 2 15V9C2 5 3 4 7 4H17C21 4 22 5 22 9V15C22 19 21 20 17 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ToggleOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.3 16H15.7C17.7 16 18.5 15.2 18.5 13.2V10.8C18.5 8.8 17.7 8 15.7 8H13.3C11.3 8 10.5 8.8 10.5 10.8V13.2C10.5 15.2 11.3 16 13.3 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 20H7C3 20 2 19 2 15V9C2 5 3 4 7 4H17C21 4 22 5 22 9V15C22 19 21 20 17 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function extractDomain(prompt) {
  const match = prompt.match(/https?:\/\/(?:www\.)?([^/\s]+)/i);
  return match ? match[1] : null;
}

export default function History({ historyItems, setHistoryItems, token, onLoginClick, onDeleteGuest }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = location.pathname.startsWith('/chat/') ? location.pathname.split('/chat/')[1] : null;

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    if (!token) return; // guest history is managed by App via localStorage
    axios.get(`${API_URL}/api/history`, { headers: authHeaders })
      .then((res) => setHistoryItems(res.data.data || []))
      .catch(() => setHistoryItems([]));
  }, [token]); // eslint-disable-line

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    if (!token) {
      // Guest delete
      onDeleteGuest?.(itemId);
      if (activeId === itemId) navigate('/');
      return;
    }
    await axios.delete(`${API_URL}/api/history/${itemId}`, { headers: authHeaders }).catch(() => {});
    setHistoryItems((prev) => (prev || []).filter((item) => item.id !== itemId));
    if (activeId === itemId) navigate('/');
  };

  const items = historyItems || [];

  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={() => { setMobileOpen(false); setCollapsed(true); }} />}
      <button className="history-toggle history-toggle--mobile" style={{ left: mobileOpen ? 260 : 0 }} onClick={() => setMobileOpen((v) => !v)} title={mobileOpen ? 'Close' : 'Open'}>
        {mobileOpen ? <ToggleOnIcon /> : <ToggleOffIcon />}
      </button>
      <aside className={`history${collapsed ? ' history--collapsed' : ''}${mobileOpen ? ' history--mobile-open' : ''}`}>
        <div className="history-header">
          {!collapsed && <h2 className="history-title">History</h2>}
          <button className="history-toggle history-toggle--desktop" onClick={() => setCollapsed((v) => !v)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ToggleOffIcon /> : <ToggleOnIcon />}
          </button>
        </div>

        {(!collapsed || mobileOpen) && (
          <>
            <ul className="history-list">
              {items.length === 0 && (
                <p className="history-empty">No history yet</p>
              )}
              {items.map((item) => {
                const firstMessage = Array.isArray(item.messages) && item.messages.length > 0
                  ? item.messages[0]
                  : null;
                const title = firstMessage?.prompt || '';
                const domain = title ? extractDomain(title) : null;
                const isActive = item.id === activeId;
                return (
                  <li
                    key={item.id}
                    className={`history-item${isActive ? ' history-item--active' : ''}`}
                    onClick={() => { navigate(`/chat/${item.id}`); setMobileOpen(false); }}
                  >
                    <div className="history-item-header">
                      {domain && <span className="history-domain">{domain}</span>}
                      <button className="history-delete" type="button" onClick={(e) => handleDelete(e, item.id)} title="Delete">
                        ✕
                      </button>
                    </div>
                    <p className="history-prompt">{title}</p>
                    <span className="history-time">{timeAgo(item.updated_at || item.created_at)}</span>
                  </li>
                );
              })}
            </ul>

            {!token && (
              <div className="history-sync-nudge">
                <p>Sign in to sync history across devices</p>
                <button className="history-login-btn" onClick={onLoginClick}>Sign in</button>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}