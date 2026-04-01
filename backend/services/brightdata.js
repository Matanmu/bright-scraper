const { chromium } = require('playwright');

async function fetchPageHTML(url) {
  if (!url) return { error: 'URL is required' };
  if (!process.env.BRIGHTDATA_WS_ENDPOINT) return { error: 'BRIGHTDATA_WS_ENDPOINT is not set' };

  let browser;
  try {
    browser = await chromium.connectOverCDP(process.env.BRIGHTDATA_WS_ENDPOINT);
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    if (response && response.status() >= 400) {
      return { error: `Page returned ${response.status()}`, status: response.status() };
    }
    await page.waitForTimeout(5000);
    // Retry content grab up to 3 times in case of mid-navigation state
    let html;
    for (let i = 0; i < 3; i++) {
      try {
        html = await page.content();
        break;
      } catch {
        await page.waitForTimeout(2000);
      }
    }
    if (!html) throw new Error('Could not retrieve page content after retries');
    return { html };
  } catch (err) {
    return { error: `Failed to fetch page: ${err.message}` };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { fetchPageHTML };