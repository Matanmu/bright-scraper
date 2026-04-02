const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 30000);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, retries = 3, delayMs = 5000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`[claude] withRetry caught: status=${err.status} type=${err.error?.type} msg=${err.message}`);
      const isOverloaded = err.status === 529
        || err.error?.type === 'overloaded_error'
        || String(err.message).includes('529')
        || String(err.message).toLowerCase().includes('overloaded');
      if (isOverloaded && i < retries) {
        const wait = delayMs * (i + 1);
        logger.warn(`[claude] overloaded, retrying in ${wait}ms (attempt ${i + 1}/${retries})`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

async function extractData(html, prompt) {
  if (!html) return { error: 'HTML content is required' };
  if (!prompt) return { error: 'Prompt is required' };
  if (!process.env.ANTHROPIC_API_KEY) return { error: 'ANTHROPIC_API_KEY is not set' };

  const text = stripHTML(html);
  logger.info(`[claude] stripped text preview: ${text.slice(0, 300)}`);

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a web scraping assistant. Extract the requested data from the page content below and return ONLY a valid JSON array. No explanation, no markdown, just raw JSON.

User request: ${prompt}

Page content:
${text}`,
        },
      ],
    }));

    const raw = message.content[0].text.trim();

    try {
      const parsed = JSON.parse(raw);
      return { data: parsed };
    } catch {
      // Try to extract JSON array from response if wrapped in text
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) return { data: JSON.parse(match[0]) };
      return { error: 'Claude returned invalid JSON', raw };
    }
  } catch (err) {
    return { error: `Claude API error: ${err.message}` };
  }
}

async function interpretPrompt(prompt, conversationHistory = []) {
  if (!process.env.ANTHROPIC_API_KEY) return { url: null, reply: null };

  const historyContext = conversationHistory.length > 0
    ? `\nConversation history:\n${conversationHistory.map((h, i) => {
        if (h.reply) return `${i + 1}. User: "${h.prompt}" → Assistant asked: "${h.reply}"`;
        if (h.url) return `${i + 1}. User: "${h.prompt}" → Scraped URL: ${h.url}`;
        return `${i + 1}. User: "${h.prompt}"`;
      }).join('\n')}\n`
    : '';

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are Bright-Scraper, an AI assistant that helps users scrape data from any website using plain English.

The user may write naturally without a URL — resolve the site and region from context:
- "amazon us" → amazon.com, "amazon spain" → amazon.es, "amazon uk" → amazon.co.uk, "amazon germany" → amazon.de, "amazon france" → amazon.fr, "amazon italy" → amazon.it, "amazon japan" → amazon.co.jp
- "ebay us" → ebay.com, "ebay uk" → ebay.co.uk, "ebay spain" → ebay.es, "ebay germany" → ebay.de, "ebay france" → ebay.fr, "ebay italy" → ebay.it, "ebay australia" → ebay.com.au
- "airbnb" → airbnb.com, "booking" → booking.com, "yelp" → yelp.com, "imdb" → imdb.com, "linkedin" → linkedin.com
- Any other site mentioned by name → infer the correct domain

Construct the best search/listing URL from the user's intent:
- "go to amazon spain and find nike shoes" → https://www.amazon.es/s?k=nike+shoes
- "get me 5 Rolex watches on ebay uk" → https://www.ebay.co.uk/sch/i.html?_nkw=Rolex+watches
- "airbnb listings in Tokyo" → https://www.airbnb.com/s/Tokyo/homes
- "frontend developer jobs on linkedin in Israel" → https://www.linkedin.com/jobs/search/?keywords=frontend+developer&location=Israel
- "top movies on imdb" → https://www.imdb.com/chart/top/ (NOT /chart/top250/ or /chart/top250movies/ — those return 404)
${historyContext}
Current message: ${prompt}

Rules:
1. If the message is a scraping request and you can resolve a URL → respond with JSON: {"url": "https://..."}
2. If the request mentions multiple sites or regions (e.g. "Spain VS USA", "amazon.com and amazon.es") → pick the FIRST one and resolve its URL. The user will ask for the second one after. Never reply with links — always return a URL to scrape.
3. ONLY ask a clarifying question if the request is completely ambiguous (no product, no site, no region at all). If you can make a reasonable guess, just go with it.
4. NEVER tell the user to open links or browse themselves. This is a scraping tool — always return a URL in JSON for the system to scrape.
5. If the message is NOT a scraping request (greeting, general question, off-topic) → respond with JSON: {"url": null, "reply": "your helpful conversational answer, ending with a nudge to try a scraping request"}
6. NEVER return anything other than valid JSON with "url" and "reply" keys.`,
        },
      ],
    }));

    const raw = message.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

    if (parsed.url) {
      new URL(parsed.url);
      logger.info(`[claude] interpreted prompt → URL: ${parsed.url}`);
      return { url: parsed.url, reply: null };
    }
    if (parsed.reply) {
      logger.info(`[claude] conversational reply: ${parsed.reply}`);
      return { url: null, reply: parsed.reply };
    }
    return { url: null, reply: null };
  } catch (err) {
    logger.warn(`[claude] interpretPrompt failed: ${err.message}`);
    return { url: null, reply: null };
  }
}

async function resolveSearchURL(baseURL, prompt, conversationHistory = []) {
  if (!process.env.ANTHROPIC_API_KEY) return baseURL;

  const historyContext = conversationHistory.length > 0
    ? `\nConversation history:\n${conversationHistory.map((h, i) => {
        if (h.reply) return `${i + 1}. User: "${h.prompt}" → Assistant asked: "${h.reply}"`;
        if (h.url) return `${i + 1}. User: "${h.prompt}" → Scraped URL: ${h.url}`;
        return `${i + 1}. User: "${h.prompt}"`;
      }).join('\n')}\n`
    : '';

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Given a base URL (may be null for follow-up prompts), conversation history, and the current user prompt, return the best direct URL to scrape. Use the conversation history to understand follow-up requests that reference previous searches. Return ONLY the URL, nothing else.
${historyContext}
Base URL: ${baseURL || 'none — this is a follow-up, infer from history'}
Current prompt: ${prompt}

Examples:
- "go to https://imdb.com and get top 5 movies" → https://www.imdb.com/chart/top/ (use ONLY this URL, NOT /chart/top250/ or /chart/top250movies/)
- "go to https://amazon.com and get 5 Logitech keyboards" → https://www.amazon.com/s?k=Logitech+keyboards
- "go to https://airbnb.com and get 5 listings in Paris" → https://www.airbnb.com/s/Paris/homes
- "go to https://ebay.com and get 5 Rolex watches" → https://www.ebay.com/sch/i.html?_nkw=Rolex+watches
- "go to https://yelp.com and get 5 pizza restaurants in NYC" → https://www.yelp.com/search?find_desc=pizza&find_loc=New+York+City
- follow-up "in Israel" after LinkedIn jobs search → https://www.linkedin.com/jobs/search/?keywords=frontend+developer&location=Israel
- follow-up "now in London" after Airbnb Paris search → https://www.airbnb.com/s/London/homes

Return only the URL:`,
        },
      ],
    }));

    const url = message.content[0].text.trim();
    new URL(url);
    logger.info(`[claude] resolved search URL: ${url}`);
    return url;
  } catch (err) {
    logger.warn(`[claude] URL resolution failed, using base URL: ${err.message}`);
    return baseURL;
  }
}

module.exports = { extractData, resolveSearchURL, interpretPrompt };