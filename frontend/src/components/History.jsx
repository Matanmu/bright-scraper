import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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

export default function History({ historyItems, setHistoryItems, token, onLoginClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = location.pathname.startsWith('/chat/') ? location.pathname.split('/chat/')[1] : null;

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    if (!token) { setHistoryItems([]); return; }
    axios.get(`${API_URL}/api/history`, { headers: authHeaders })
      .then((res) => setHistoryItems(res.data.data || []))
      .catch(() => setHistoryItems([]));
  }, [token]); // eslint-disable-line

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    await axios.delete(`${API_URL}/api/history/${itemId}`, { headers: authHeaders }).catch(() => {});
    setHistoryItems((prev) => (prev || []).filter((item) => item.id !== itemId));
    if (activeId === itemId) navigate('/');
  };

  const items = historyItems || [];

  return (
    <aside className="history">
      <h2 className="history-title">History</h2>

      {!token ? (
        <div className="history-auth-prompt">
          <p>Sign in to save and view your scraping history.</p>
          <button className="history-login-btn" onClick={onLoginClick}>Log in</button>
        </div>
      ) : (
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
                onClick={() => navigate(`/chat/${item.id}`)}
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
      )}
    </aside>
  );
}
