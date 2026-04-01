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
      const scrapes = userChats.flatMap((c) =>
        (c.messages || []).map((m) => ({
          chatId: c._id,
          prompt: m.prompt,
          results: Array.isArray(m.results) ? m.results : [],
          resultCount: Array.isArray(m.results) ? m.results.length : 0,
          timestamp: m.created_at || c.updated_at,
        }))
      );
      scrapes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return {
        id: u._id,
        email: u.email,
        email_verified: u.email_verified,
        created_at: u.created_at,
        scrapeCount: scrapes.length,
        scrapes,
      };
    });

    logger.info(`[admin] users list requested by ${req.user.email}`);
    return res.json({ users: result });
  } catch (err) {
    logger.error(`[admin] users error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
});

// GET /api/admin/stats
// Quick summary counts
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [userCount, chatCount] = await Promise.all([
      User.countDocuments(),
      Chat.countDocuments(),
    ]);
    const chats = await Chat.find({}, { messages: 1 }).lean();
    const totalScrapes = chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0);

    return res.json({ userCount, totalScrapes, chatCount });
  } catch (err) {
    logger.error(`[admin] stats error: ${err.message}`);
    return res.status(500).json({ error: 'Failed to load stats.' });
  }
});

module.exports = router;
