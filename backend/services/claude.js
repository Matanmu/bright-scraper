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

async function resolveSearchURL(baseURL, prompt) {
  if (!process.env.ANTHROPIC_API_KEY) return baseURL;

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Given this base URL and user prompt, return the best direct search/listing URL to scrape. Return ONLY the URL, nothing else.

Base URL: ${baseURL}
User prompt: ${prompt}

Examples:
- "go to https://imdb.com and get top 5 movies" → https://www.imdb.com/chart/top/
- "go to https://amazon.com and get 5 Logitech keyboards" → https://www.amazon.com/s?k=Logitech+keyboards
- "go to https://airbnb.com and get 5 listings in Paris" → https://www.airbnb.com/s/Paris/homes
- "go to https://ebay.com and get 5 Rolex watches" → https://www.ebay.com/sch/i.html?_nkw=Rolex+watches
- "go to https://yelp.com and get 5 pizza restaurants in NYC" → https://www.yelp.com/search?find_desc=pizza&find_loc=New+York+City

Return only the URL:`,
        },
      ],
    }));

    const url = message.content[0].text.trim();
    // Validate it looks like a URL
    new URL(url);
    logger.info(`[claude] resolved search URL: ${url}`);
    return url;
  } catch (err) {
    logger.warn(`[claude] URL resolution failed, using base URL: ${err.message}`);
    return baseURL;
  }
}

module.exports = { extractData, resolveSearchURL };