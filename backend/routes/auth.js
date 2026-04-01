const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');
const logger = require('../logger');

const router = express.Router();

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/register', async (req, res) => {
  const { email, password, termsAccepted } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!termsAccepted) {
    return res.status(400).json({ error: 'You must accept the Terms of Use to register' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      if (!existing.email_verified) {
        // Resend a fresh code if they try to register again before verifying
        const code = generateCode();
        const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await User.updateOne({ _id: existing._id }, { verification_code: code, code_expires_at: expires });
        await sendVerificationEmail(existing.email, code);
        return res.status(200).json({ pendingVerification: true, message: 'Verification code resent.' });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const password_hash = await bcrypt.hash(password, 10);
    const code = generateCode();
    const code_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await new User({
      _id: id,
      email: email.toLowerCase().trim(),
      password_hash,
      created_at: now,
      email_verified: false,
      verification_code: code,
      code_expires_at,
      terms_accepted_at: now,
    }).save();

    await sendVerificationEmail(email.toLowerCase().trim(), code);

    logger.info(`[auth] registered new user (pending verification): ${email}`);
    return res.status(201).json({ pendingVerification: true });
  } catch (err) {
    logger.error(`[auth] register error: ${err.message}`);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    if (!user.verification_code || user.verification_code !== code.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (new Date(user.code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please register again.' });
    }

    await User.updateOne(
      { _id: user._id },
      { email_verified: true, verification_code: null, code_expires_at: null }
    );

    const token = generateToken(user._id, user.email);
    logger.info(`[auth] email verified: ${user.email}`);
    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    logger.error(`[auth] verify error: ${err.message}`);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
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
      return res.status(404).json({ error: 'No account found with that email address.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before signing in.', pendingVerification: true, email: user.email });
    }

    const token = generateToken(user._id, user.email);
    logger.info(`[auth] login: ${user.email}`);
    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    logger.error(`[auth] login error: ${err.message}`);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Step 1: request a reset code
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success to avoid email enumeration
    if (user && user.email_verified) {
      const code = generateCode();
      const code_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await User.updateOne({ _id: user._id }, { verification_code: code, code_expires_at });
      await sendPasswordResetEmail(user.email, code);
    }
    logger.info(`[auth] password reset requested for: ${email}`);
    return res.json({ ok: true });
  } catch (err) {
    logger.error(`[auth] forgot-password error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// Step 2: verify code + set new password
router.post('/reset-password', async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    return res.status(400).json({ error: 'Email, code, and new password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.verification_code || user.verification_code !== code.trim()) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
    if (new Date(user.code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: user._id },
      { password_hash, verification_code: null, code_expires_at: null }
    );
    logger.info(`[auth] password reset success: ${user.email}`);
    return res.json({ ok: true });
  } catch (err) {
    logger.error(`[auth] reset-password error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;
