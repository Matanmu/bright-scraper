const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const logger = require('../logger');

const router = express.Router();

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const password_hash = await bcrypt.hash(password, 10);

    await new User({ _id: id, email: email.toLowerCase().trim(), password_hash, created_at: now }).save();

    const token = generateToken(id, email.toLowerCase().trim());
    logger.info(`[auth] registered new user: ${email}`);
    return res.status(201).json({ token, user: { id, email: email.toLowerCase().trim() } });
  } catch (err) {
    logger.error(`[auth] register error: ${err.message}`);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.email);
    logger.info(`[auth] login: ${user.email}`);
    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    logger.error(`[auth] login error: ${err.message}`);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;