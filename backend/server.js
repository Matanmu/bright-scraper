require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./logger');
const { connectDB } = require('./db');
const { authMiddleware } = require('./middleware/auth');
const scrapeRouter = require('./routes/scrape');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

app.set('trust proxy', 1);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(authMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', scrapeRouter);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

connectDB().catch((err) => {
  logger.error(`Failed to connect to MongoDB: ${err.message}`);
  process.exit(1);
});