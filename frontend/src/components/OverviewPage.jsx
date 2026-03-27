import './OverviewPage.scss';

const STACK = [
  {
    category: 'Frontend',
    items: [
      { name: 'React', desc: 'UI framework' },
      { name: 'React Router', desc: 'Client-side routing' },
      { name: 'SCSS', desc: 'Styling' },
      { name: 'Axios', desc: 'HTTP requests' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'Node.js', desc: 'Runtime' },
      { name: 'Express', desc: 'API server' },
      { name: 'SQLite', desc: 'Local database — zero setup required' },
      { name: 'JWT', desc: 'Authentication' },
      { name: 'Playwright', desc: 'CDP client for BrightData connection' },
    ],
  },
  {
    category: 'AI & Scraping',
    items: [
      { name: 'Claude Sonnet', desc: 'Extracts structured data from HTML' },
      { name: 'Claude Haiku', desc: 'Resolves best URL to scrape' },
      { name: 'BrightData', desc: 'Scraping Browser — bypasses bot detection' },
    ],
  },
  {
    category: 'Dev Tools',
    items: [
      { name: 'Claude Code', desc: 'AI coding assistant — built this entire project' },
      { name: 'Helmet', desc: 'Security headers' },
      { name: 'express-rate-limit', desc: 'API rate limiting' },
    ],
  },
];

const FLOW = [
  { step: '01', title: 'You type a prompt', desc: 'Describe what you want to scrape in plain English, including the website URL.' },
  { step: '02', title: 'Claude resolves the URL', desc: 'Claude AI figures out the best search/listing page to scrape based on your prompt.' },
  { step: '03', title: 'BrightData fetches the page', desc: 'Playwright connects to BrightData\'s Scraping Browser, which renders the full page and bypasses bot detection.' },
  { step: '04', title: 'Claude extracts the data', desc: 'The rendered HTML is sent to Claude, which extracts exactly what you asked for as structured JSON.' },
  { step: '05', title: 'Results saved & displayed', desc: 'Data is saved to Supabase for history, and displayed as a table you can export to CSV.' },
];

export default function OverviewPage() {
  return (
    <div className="overview">
      {/* Hero */}
      <section className="ov-hero">
        <div className="ov-hero-badge">Open Source Project</div>
        <h1 className="ov-hero-title">Bright-Scraper</h1>
        <p className="ov-hero-sub">
          A no-code web scraping tool that lets anyone extract structured data from any website
          using plain English — powered by BrightData's Scraping Browser and Claude AI.
        </p>
      </section>

      {/* About */}
      <section className="ov-section">
        <h2 className="ov-section-title">About the Builder</h2>
        <div className="ov-about-card">
          <div className="ov-about-avatar">M</div>
          <div>
            <p className="ov-about-name">Matan Mualem</p>
            <p className="ov-about-desc">
                Matan Mualem is a full‑stack engineer skilled in Node.js, React, and Next.js, building scalable and AI‑powered web solutions.
              Built this project to explore how AI can make web scraping accessible to non-technical users —
              combining <strong>BrightData's Scraping Browser API</strong> for bypassing bot detection with
              <strong> Claude AI</strong> for intelligent data extraction. The entire codebase was built
              using <strong>Claude Code</strong> as an AI coding assistant.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="ov-section">
        <h2 className="ov-section-title">How It Works</h2>
        <div className="ov-flow">
          {FLOW.map((item) => (
            <div key={item.step} className="ov-flow-item">
              <div className="ov-flow-step">{item.step}</div>
              <div>
                <p className="ov-flow-title">{item.title}</p>
                <p className="ov-flow-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="ov-section">
        <h2 className="ov-section-title">Tech Stack</h2>
        <div className="ov-stack-grid">
          {STACK.map((group) => (
            <div key={group.category} className="ov-stack-group">
              <p className="ov-stack-category">{group.category}</p>
              <ul className="ov-stack-list">
                {group.items.map((item) => (
                  <li key={item.name} className="ov-stack-item">
                    <span className="ov-stack-name">{item.name}</span>
                    <span className="ov-stack-desc">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
