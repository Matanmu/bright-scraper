import { useState } from 'react';

const MOCK_DATA = [
  { title: 'Logitech MX Keys', price: '$99.99', rating: '4.7' },
  { title: 'Logitech K800', price: '$79.99', rating: '4.5' },
  { title: 'Logitech K380', price: '$39.99', rating: '4.6' },
  { title: 'Logitech MX Mechanical', price: '$149.99', rating: '4.4' },
  { title: 'Logitech K120', price: '$19.99', rating: '4.3' },
];

export default function PromptInput({ onResults }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt || prompt.trim().length === 0) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    await new Promise((r) => setTimeout(r, 1500));

    onResults(MOCK_DATA, prompt);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="prompt-form">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. go to https://amazon.com and get me 5 Logitech keyboards with title, price and rating"
        rows={4}
      />
      <div className="form-footer">
        <span className="prompt-hint">Include a full URL in your prompt</span>
        <button type="submit" disabled={loading}>
          {loading ? (
            <span className="btn-inner">
              <span className="spinner" />
              Scraping...
            </span>
          ) : (
            '⚡ Scrape'
          )}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
