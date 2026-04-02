const express = require('express');
const { User, Chat } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const logger = require('../logger');

const router = express.Router();

// GET /api/admin/users
// Returns all users with their scrape history
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password_hash: 0 }).lean();

    const chats = await Chat.find({}).lean();

    // Map chats by user_id
    const chatsByUser = {};
    for (const chat of chats) {
      if (!chatsByUser[chat.user_id]) chatsByUser[chat.user_id] = [];
      chatsByUser[chat.user_id].push(chat);
    }

    const result = users.map((u) => {
      const userChats = chatsByUser[u._id] || [];
      const messages = userChats.flatMap((c) =>
        (c.messages || [])
          .filter((m) => m.prompt || m.reply)
          .map((m) => ({
            chatId: c._id,
            type: m.results ? 'scrape' : m.reply ? 'reply' : 'prompt',
            prompt: m.prompt || null,
            reply: m.reply || null,
            results: Array.isArray(m.results) ? m.results : [],
            resultCount: Array.isArray(m.results) ? m.results.length : 0,
            timestamp: m.created_at || c.updated_at,
          }))
      );
      messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const scrapeCount = messages.filter((m) => m.type === 'scrape').length;

      return {
        id: u._id,
        email: u.email,
        email_verified: u.email_verified,
        created_at: u.created_at,
        scrapeCount,
        scrapes: messages,
      };
    });

    logger.info(`[admin] users list requested by ${req.user.email}`);
    return res.json({ users: result });
  } catch (err) {
    logger.error(`[admin] users error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
});

// GET /api/admin/guests
// Returns all guest sessions with their activity
router.get('/guests', requireAdmin, async (req, res) => {
  try {
    const guestChats = await Chat.find({ guest_id: { $ne: null } }).sort({ updated_at: -1 }).lean();

    // Group by guest_id
    const byGuest = {};
    for (const chat of guestChats) {
      if (!byGuest[chat.guest_id]) byGuest[chat.guest_id] = [];
      byGuest[chat.guest_id].push(chat);
    }

    const guests = Object.entries(byGuest).map(([guestId, chats]) => {
      const messages = chats.flatMap((c) =>
        (c.messages || [])
          .filter((m) => m.prompt || m.reply)
          .map((m) => ({
            chatId: c._id,
            type: m.results ? 'scrape' : m.reply ? 'reply' : 'prompt',
            prompt: m.prompt || null,
            reply: m.reply || null,
            results: Array.isArray(m.results) ? m.results : [],
            resultCount: Array.isArray(m.results) ? m.results.length : 0,
            timestamp: m.created_at || c.updated_at,
          }))
      );
      messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const firstSeen = chats.map((c) => c.created_at).sort()[0];
      return {
        guestId,
        firstSeen,
        scrapeCount: messages.filter((m) => m.type === 'scrape').length,
        scrapes: messages,
      };
    });

    guests.sort((a, b) => new Date(b.firstSeen) - new Date(a.firstSeen));
    logger.info(`[admin] guests list requested by ${req.user.email}`);
    return res.json({ guests });
  } catch (err) {
    logger.error(`[admin] guests error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to load guests.' });
  }
});

// GET /api/admin/stats
// Quick summary counts
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [userCount, chatCount, guestCount] = await Promise.all([
      User.countDocuments(),
      Chat.countDocuments({ user_id: { $ne: null } }),
      Chat.distinct('guest_id', { guest_id: { $ne: null } }).then((ids) => ids.length),
    ]);
    const chats = await Chat.find({}, { messages: 1 }).lean();
    const totalScrapes = chats.reduce((sum, c) => sum + (c.messages?.filter((m) => m.prompt && m.results).length || 0), 0);

    return res.json({ userCount, totalScrapes, chatCount, guestCount });
  } catch (err) {
    logger.error(`[admin] stats error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to load stats.' });
  }
});

module.exports = router;
