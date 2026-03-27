# Bright-Scraper

A no-code web scraping tool — describe what you want to extract in plain English and get back structured data as a table or CSV. No code required.

Built with **BrightData Scraping Browser** (bypasses bot detection) and **Claude AI** (understands your prompt and extracts structured data).

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![Node](https://img.shields.io/badge/Node.js-20-green) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## How it works

1. You type a plain-English prompt, e.g. _"go to amazon.com and get me 5 Logitech keyboards with title, price and rating"_
2. Claude resolves the best URL to scrape
3. BrightData's Scraping Browser renders the page and bypasses bot detection
4. Claude extracts exactly what you asked for as structured JSON
5. Results are displayed as a table — export to CSV in one click

---

## Prerequisites

- Node.js 18+
- A [BrightData](https://brightdata.com) account with a **Scraping Browser** zone (free trial available)
- An [Anthropic](https://console.anthropic.com) API key

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/matanmu/bright-scraper
cd bright-scraper
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Fill in your `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
BRIGHTDATA_WS_ENDPOINT=wss://brd-customer-...@brd.superproxy.io:9222
JWT_SECRET=any-random-string
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

**Where to get the keys:**
- `ANTHROPIC_API_KEY` → [console.anthropic.com](https://console.anthropic.com) → API Keys
- `BRIGHTDATA_WS_ENDPOINT` → BrightData dashboard → Scraping Browser zone → Access parameters → WebSocket endpoint

```bash
npm install
node server.js
```

### 3. Frontend

```bash
cd ../frontend
cp .env.example .env
# .env defaults are fine for local dev — no changes needed
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
bright-scraper/
├── backend/
│   ├── server.js          # Express entry point
│   ├── db.js              # SQLite setup
│   ├── middleware/
│   │   └── auth.js        # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js        # /api/auth/register, /api/auth/login
│   │   └── scrape.js      # /api/scrape, /api/history, /api/status
│   └── services/
│       ├── brightdata.js  # Playwright + BrightData CDP connection
│       ├── claude.js      # Anthropic SDK — URL resolution + data extraction
│       └── database.js    # SQLite chat history
└── frontend/
    └── src/
        ├── App.jsx                    # Main app + routing
        └── components/
            ├── History.jsx            # Sidebar with past scrapes
            ├── LoginModal.jsx         # Auth modal
            ├── PromptInput.jsx        # Input component
            └── ResultsTable.jsx       # Results + CSV export
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `BRIGHTDATA_WS_ENDPOINT` | BrightData Scraping Browser WebSocket URL |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Port to run the backend on (default: 5001) |
| `CORS_ORIGIN` | Allowed frontend origin (default: http://localhost:3000) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend URL (default: http://localhost:5001) |
| `REACT_APP_SHOW_OVERVIEW` | Set to `true` to show the Overview page |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).