const express = require('express');
const { chromium } = require('playwright');
const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');
const logger = require('../logger');
const { requireAuth } = require('../middleware/auth');
const { fetchPageHTML } = require('../services/brightdata');
const { extractData, resolveSearchURL, interpretPrompt } = require('../services/claude');
const { createChat, appendMessage, getHistory, deleteChat } = require('../services/database');

const router = express.Router();

// Save a message to an existing chat or create a new one with the given ID.
// If chatId exists in DB → append. If not → create with that ID.
async function saveMessage(chatId, message, userId, guestId) {
  if (!userId && !guestId) return null;
  if (chatId) {
    const { data: updated, error: appendError } = await appendMessage(chatId, message, userId, guestId);
    if (!appendError && updated) return updated.id;
    // Chat doesn't exist yet (first message with client-generated ID) → create it
    logger.info(`[scrape] chat ${chatId} not found, creating new`);
    const { data: created, error: createError } = await createChat(message, userId, chatId, guestId);
    if (createError) logger.error(`[scrape] db create error: ${createError}`);
    return created?.id || null;
  }
  const { data: created, error: createError } = await createChat(message, userId, null, guestId);
  if (createError) logger.error(`[scrape] db create error: ${createError}`);
  return created?.id || null;
}

const scrapeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, please try again later.' },
});

const PRIVATE_IP = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/i;

function extractURL(prompt) {
  const match = prompt.match(/https?:\/\/[^\s]+/i);
  if (!match) return null;
  try {
    const url = new URL(match[0]);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (PRIVATE_IP.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

router.get('/status', async (req, res) => {
  const [claudeStatus, brightdataStatus] = await Promise.all([
    (async () => {
      if (!process.env.ANTHROPIC_API_KEY) return 'down';
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        });
        return 'up';
      } catch (err) {
        return err.status === 529 ? 'degraded' : 'down';
      }
    })(),
    (async () => {
      if (!process.env.BRIGHTDATA_WS_ENDPOINT) return 'down';
      let browser;
      try {
        browser = await chromium.connectOverCDP(process.env.BRIGHTDATA_WS_ENDPOINT, { timeout: 10000 });
        return 'up';
      } catch {
        return 'down';
      } finally {
        if (browser) await browser.close();
      }
    })(),
  ]);
  res.json({ claude: claudeStatus, brightdata: brightdataStatus });
});

router.post('/scrape', scrapeLimiter, async (req, res) => {
  let clientAborted = false;
  req.on('close', () => { clientAborted = true; });

  const { prompt, chatId, conversationHistory, guestId } = req.body;
  logger.info(`[scrape] received prompt (length: ${prompt?.length}), chatId: ${chatId || 'none'} | prompt: ${prompt}`);

  if (!prompt || !prompt.trim()) {
    logger.warn('[scrape] empty prompt');
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const url = extractURL(prompt);
  const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [];
  logger.info(`[scrape] url in prompt: ${url || 'none'}, history entries: ${history.length}`);

  if (chatId && !/^[0-9a-f-]{36}$/i.test(chatId)) {
    return res.status(400).json({ error: 'Invalid chat ID.' });
  }

  // If no explicit URL, use Claude to interpret the natural language prompt
  let resolvedStartURL = url;
  if (!url) {
    const { url: interpreted, reply } = await interpretPrompt(prompt, history);
    if (reply) {
      logger.info(`[scrape] conversational reply`);
      const userId = req.user?.userId;
      const effectiveGuestId = userId ? null : (guestId || null);
      let savedChatId = chatId || null;
      if (userId || effectiveGuestId) {
        const message = { prompt, reply };
        savedChatId = await saveMessage(chatId, message, userId, effectiveGuestId);
      }
      return res.json({ reply, chatId: savedChatId });
    }
    if (interpreted) {
      resolvedStartURL = interpreted;
    } else if (history.length === 0) {
      return res.status(400).json({ error: 'Could not determine which website to scrape. Please mention a site name or URL.' });
    }
  }

  let searchURL = await resolveSearchURL(resolvedStartURL, prompt, history);
  logger.info(`[scrape] fetching URL: ${searchURL}`);
  let { html, error: fetchError, status } = await fetchPageHTML(searchURL);
  if (status >= 400 && searchURL !== resolvedStartURL && resolvedStartURL) {
    logger.warn(`[scrape] resolved URL returned ${status}, falling back to: ${resolvedStartURL}`);
    searchURL = resolvedStartURL;
    ({ html, error: fetchError } = await fetchPageHTML(resolvedStartURL));
  }
  if (fetchError) {
    logger.error(`[scrape] brightdata error: ${fetchError}`);
    const isBlocked = fetchError.includes('403') || fetchError.includes('401') || fetchError.includes('blocked');
    return res.status(isBlocked ? 403 : 500).json({
      error: isBlocked
        ? 'This site is blocking access right now. You can try again — a different IP may get through.'
        : 'Failed to fetch the page. Please try again.',
      retryable: true,
    });
  }
  logger.info(`[scrape] got HTML, length: ${html.length}`);

  // Detect soft 404 / bot-block pages before sending to Claude
  const htmlLower = html.slice(0, 5000).toLowerCase();
  const isErrorPage = (
    html.length < 150_000 &&
    (htmlLower.includes('404') || htmlLower.includes('not found') || htmlLower.includes('page not found') ||
     htmlLower.includes('access denied') || htmlLower.includes('403 forbidden') ||
     htmlLower.includes('captcha') || htmlLower.includes('robot') || htmlLower.includes('are you human'))
  );
  if (isErrorPage) {
    logger.warn(`[scrape] error/blocked page detected (length: ${html.length}), aborting`);
    return res.status(403).json({
      error: 'This site is blocking access right now. You can try again — a different IP may get through.',
      retryable: true,
    });
  }

  logger.info('[scrape] sending to Claude...');
  const { data, error: extractError, raw } = await extractData(html, prompt);
  if (extractError) {
    logger.error(`[scrape] claude error: ${extractError} | raw: ${raw}`);
    return res.status(500).json({ error: 'Failed to extract data. Please try again.' });
  }
  logger.info(`[scrape] claude returned: ${JSON.stringify(data).slice(0, 200)}`);

  if (clientAborted) {
    logger.info('[scrape] client disconnected before DB write — skipping');
    return;
  }

  const userId = req.user?.userId;
  const effectiveGuestId = userId ? null : (guestId || null);
  let savedChatId = null;

  if (userId || effectiveGuestId) {
    const message = { prompt, results: data };
    logger.info(`[scrape] saving to database (${userId ? 'user' : 'guest'})...`);
    savedChatId = await saveMessage(chatId, message, userId, effectiveGuestId);
    if (savedChatId) logger.info(`[scrape] saved to chat ${savedChatId}`);
  } else {
    logger.info('[scrape] anonymous — skipping history save');
  }

  return res.json({ data, chatId: savedChatId, saved: !!savedChatId, resolvedUrl: searchURL });
});

router.get('/history', requireAuth, async (req, res) => {
  const { data, error } = await getHistory(req.user.userId);
  if (error) {
    logger.error(`[history] get error: ${error}`);
    return res.status(500).json({ error: 'Failed to load history.' });
  }
  return res.json({ data });
});

router.delete('/history/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid ID.' });
  }
  logger.info(`[history] delete id: ${id}`);
  const { success, error } = await deleteChat(id, req.user.userId);
  if (error) {
    logger.error(`[history] delete error: ${error}`);
    return res.status(500).json({ error: 'Failed to delete history item.' });
  }
  return res.json({ success });
});

module.exports = router;