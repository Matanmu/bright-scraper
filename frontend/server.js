const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD = path.join(__dirname, 'build');

// index.html — never cache
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(BUILD, 'index.html'));
});

// static assets — cache forever (content-hashed filenames)
app.use('/static', express.static(path.join(BUILD, 'static'), {
  maxAge: '1y',
  immutable: true,
}));

// everything else (SPA fallback) — no cache
app.use(express.static(BUILD, { maxAge: 0 }));
app.get('/*splat', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(BUILD, 'index.html'));
});

app.listen(PORT, () => console.log(`Frontend running on port ${PORT}`));
