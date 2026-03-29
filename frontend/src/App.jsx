import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import History from './components/History';
import ResultsTable from './components/ResultsTable';
import OverviewPage from './components/OverviewPage';
import LoginModal from './components/LoginModal';
import './App.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const PLACEHOLDERS = [
  'go to https://amazon.com and get me 5 Logitech keyboards with title, price and rating',
  'go to https://ebay.com and get me 5 Rolex watches with name, price and link',
  'go to https://airbnb.com and get me 5 listings in Paris with title, price and rating',
  'go to https://imdb.com and get me top 5 movies with title, year and rating',
];

function useAnimatedPlaceholder() {
  const [placeholder, setPlaceholder] = useState('');
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let current = '';
    let charIndex = 0;
    let phase = 'typing'; // typing | pause | deleting

    function tick() {
      const target = PLACEHOLDERS[index];

      if (phase === 'typing') {
        current = target.slice(0, charIndex + 1);
        charIndex++;
        setPlaceholder(current);
        if (charIndex === target.length) {
          phase = 'pause';
          timeoutRef.current = setTimeout(tick, 2000);
        } else {
          timeoutRef.current = setTimeout(tick, 30);
        }
      } else if (phase === 'pause') {
        phase = 'deleting';
        timeoutRef.current = setTimeout(tick, 30);
      } else if (phase === 'deleting') {
        current = target.slice(0, charIndex - 1);
        charIndex--;
        setPlaceholder(current);
        if (charIndex === 0) {
          phase = 'typing';
          setIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
          timeoutRef.current = setTimeout(tick, 400);
        } else {
          timeoutRef.current = setTimeout(tick, 15);
        }
      }
    }

    timeoutRef.current = setTimeout(tick, 500);
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  return placeholder;
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76L20 10l-6.12 1.24L12 17l-1.88-5.76L4 10l6.12-1.24z"/>
      <path d="M5 3l.88 2.68L8 6.5l-2.12.82L5 10l-.88-2.68L2 6.5l2.12-.82z"/>
      <path d="M19 14l.88 2.68L22 17.5l-2.12.82L19 21l-.88-2.68L16 17.5l2.12-.82z"/>
    </svg>
  );
}

function LogoIcon() {
  return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512" fill="none">
          <path d="M0 63.2099C0 28.3 28.3 0 63.2099 0H448.79C483.7 0 512 28.3 512 63.2099V448.79C512 483.7 483.7 512 448.79 512H63.2099C28.3 512 0 483.7 0 448.79V63.2099Z" fill="#3D7FFC"/>
          <path d="M220.363 115.876C225.342 125.336 222.853 133.302 219.368 141.766C213.891 155.706 215.385 169.148 225.342 180.599C235.299 192.548 249.24 194.042 263.678 191.055C283.593 186.574 295.044 167.655 292.056 146.744C290.563 136.787 284.588 126.83 290.065 115.876C285.086 118.366 285.086 118.366 279.112 128.323C273.635 121.851 268.657 114.881 262.682 107.911C257.704 102.434 252.725 97.4553 255.712 88.4937C249.737 91.4809 246.75 95.4638 244.759 100.442C243.265 105.421 242.269 110.4 241.274 115.379C240.278 120.357 237.789 124.838 232.81 127.825C229.823 122.349 226.836 118.366 220.363 115.876Z" fill="white"/>
          <path d="M208.593 422.618V398.267L234.975 394.837V255.594L210.649 247.706V220.612L277.117 211.695L291.165 210.306V219.583V394.494L317.204 398.267V422.618H208.593Z" fill="white"/>
      </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function ComposeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}

function StatusDot({ status }) {
  const label = { up: 'Operational', degraded: 'Degraded', down: 'Down' }[status] || '…';
  return <span className={`status-dot status-dot--${status || 'loading'}`} title={label} />;
}

function Header({ user, onLoginClick, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="header-left">
          <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <LogoIcon />
          </div>
          <span className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Bright-Scraper</span>
          {process.env.REACT_APP_SHOW_OVERVIEW === 'true' && (
            <nav className="header-nav">
              <button className="nav-link" onClick={() => navigate('/about')}><InfoIcon />About this project</button>
            <a className="nav-link" href="https://github.com/Matanmu/bright-scraper" target="_blank" rel="noreferrer"><GitHubIcon />GitHub</a>
            </nav>
          )}
        </div>
        <div className="header-right">
          {user ? (
            <>
              <div className="header-user">
                <div className="header-avatar-placeholder">{user.email?.[0].toUpperCase()}</div>
                <span className="header-user-name">{user.email}</span>
              </div>
              <button className="btn-ghost" onClick={onLogout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={onLoginClick}>Log in</button>
              <button className="btn-gradient" onClick={onLoginClick}>Get Started</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ChatPage({ onHistoryUpdate, token, apiStatus }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(id || null);
  const conversationEndRef = useRef(null);
  const animatedPlaceholder = useAnimatedPlaceholder();

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  // Scroll to bottom of conversation when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset state on home, load chat by ID otherwise
  useEffect(() => {
    if (!id) {
      setPrompt('');
      setMessages([]);
      setChatId(null);
      setError(null);
      return;
    }
    setChatId(id);
    if (!token) return;
    axios.get(`${API_URL}/api/history`, { headers: authHeaders })
      .then((res) => {
        const item = (res.data.data || []).find((h) => h.id === id);
        if (item && Array.isArray(item.messages)) {
          setMessages(item.messages.map((m) => ({ prompt: m.prompt, results: m.results })));
        }
      })
      .catch(() => {});
  }, [id, token]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) { setError('Please enter a prompt'); return; }

    setLoading(true);
    setError(null);

    const submittedPrompt = prompt;
    setPrompt('');

    try {
      const res = await axios.post(
        `${API_URL}/api/scrape`,
        { prompt: submittedPrompt, chatId },
        { headers: authHeaders },
      );

      const newMessage = { prompt: submittedPrompt, results: res.data.data };
      setMessages((prev) => [...prev, newMessage]);

      if (res.data.chatId) {
        const newChatId = res.data.chatId;
        setChatId(newChatId);

        // Navigate to the chat URL if not already there
        if (!id || id !== newChatId) {
          navigate(`/chat/${newChatId}`, { replace: !!id });
        }

        // Refresh history sidebar
        axios.get(`${API_URL}/api/history`, { headers: authHeaders })
          .then((histRes) => onHistoryUpdate(histRes.data.data || []))
          .catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <main className={`app-main${hasMessages ? ' app-main--results' : ''}`}>
      {hasMessages && (
        <div className="app-main-content">
          <div className="conversation">
            {messages.map((msg, i) => (
              <div key={i} className="conversation-message">
                <p className="conversation-message-prompt">{msg.prompt}</p>
                <ResultsTable data={msg.results} />
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>
      )}

      {!hasMessages && (
        <div className="app-main-centered">
          {!id && (
            <div className="hero">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot" />
                Powered by BrightData Scraping Browser API
              </div>
              <h1 className="hero-title">
                Turn your words into<br />
                <span className="hero-title-gradient">web scrapers</span>
              </h1>
              <p className="hero-subtitle">
                Describe what you need in plain English — Bright-Scraper extracts structured data
                from any website in seconds, no code required.
              </p>
            </div>
          )}
        </div>
      )}

      <div className={`input-card-wrapper${hasMessages ? ' input-card-wrapper--sticky' : ''}`}>
        <div className="input-card-glow" />
        <div className={`input-card${loading ? ' input-card--loading' : ''}`}>
          <form onSubmit={handleSubmit}>
            <div className={`input-card-body${hasMessages ? ' input-card-body--collapsed' : ''}`}>
              {loading && (
                <div className="scraping-overlay">
                  <span className="scraping-spinner" />
                  <span className="scraping-text">Scraping the web...</span>
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setError(null); }}
                placeholder={animatedPlaceholder}
                className={`scraper-textarea${hasMessages ? ' scraper-textarea--collapsed' : ''}`}
                rows={hasMessages ? 1 : 5}
                disabled={loading}
              />
              {!hasMessages && (
                <div className="api-status-bar">
                  <span className="api-status-item">
                    <StatusDot status={apiStatus?.claude} />
                    Claude
                  </span>
                  <span className="api-status-item">
                    <StatusDot status={apiStatus?.brightdata} />
                    BrightData
                  </span>
                </div>
              )}
              {error && <p className="input-error">{error}</p>}
            </div>
            {!hasMessages && (
              <div className="input-card-footer">
                <div className="footer-actions">
                  <button type="button" className="footer-action-btn">
                    <SparklesIcon />
                    Add AI features
                  </button>
                  <button type="button" className="footer-action-btn">
                    <PlusIcon />
                    Connect your data
                  </button>
                </div>
                <button type="submit" className="btn-build" disabled={loading || !prompt.trim()}>
                  {loading ? <><span className="spinner" /> Scraping...</> : 'Build it'}
                </button>
              </div>
            )}
            {hasMessages && (
              <div className="input-card-footer">
                <div className="footer-actions" />
                <button type="submit" className="btn-build" disabled={loading || !prompt.trim()}>
                  {loading ? <><span className="spinner" /> Scraping...</> : 'Build it'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [historyItems, setHistoryItems] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const navigate = useNavigate();

  // Restore auth from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('scraperToken');
    const savedUser = localStorage.getItem('scraperUser');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('scraperToken');
        localStorage.removeItem('scraperUser');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = () =>
      axios.get(`${API_URL}/api/status`)
        .then((r) => { if (!cancelled) setApiStatus(r.data); })
        .catch(() => { if (!cancelled) setApiStatus({ claude: 'down', brightdata: 'down' }); });
    check();
    const interval = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('scraperToken', newToken);
    localStorage.setItem('scraperUser', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setHistoryItems(null); // reload history
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('scraperToken');
    localStorage.removeItem('scraperUser');
    setToken(null);
    setUser(null);
    setHistoryItems([]);
  };

  const handleNewScrape = () => {
    navigate('/');
  };

  return (
    <div className="app">
      <Header user={user} onLoginClick={() => setShowLogin(true)} onLogout={handleLogout} />
      <div className="app-body">
        <History
          historyItems={historyItems}
          setHistoryItems={setHistoryItems}
          token={token}
          onLoginClick={() => setShowLogin(true)}
        />
        <Routes>
          <Route path="/" element={<ChatPage onHistoryUpdate={setHistoryItems} token={token} apiStatus={apiStatus} />} />
          <Route path="/chat/:id" element={<ChatPage onHistoryUpdate={setHistoryItems} token={token} apiStatus={apiStatus} />} />
          {process.env.REACT_APP_SHOW_OVERVIEW === 'true' && (
            <Route path="/about" element={<div className="app-main"><OverviewPage /></div>} />
          )}
        </Routes>
      </div>
      <button className="new-scrape-fab" onClick={handleNewScrape} title="New scrape">
        <ComposeIcon />
        <span>New scrape</span>
      </button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />}
    </div>
  );
}
