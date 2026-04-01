const { google } = require('googleapis');
const logger = require('../logger');

function createGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function makeEmailRaw(to, subject, html) {
  const from = process.env.SMTP_FROM || process.env.GMAIL_USER;
  const message = [
    `From: "Bright-Scraper" <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n');
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendVerificationEmail(toEmail, code) {
if (!process.env.GMAIL_CLIENT_ID) {
    logger.warn(`[email] Gmail API not configured — verification code for ${toEmail}: ${code}`);
    return { ok: true };
  }

  const html = `
    <div style="font-family:sans-serif;max-width:440px;margin:0 auto;padding:40px 24px;">
      <div style="background:#3D7FFC;width:48px;height:48px;border-radius:12px;margin-bottom:24px;text-align:center;line-height:48px;">
        <span style="color:#fff;font-size:22px;font-weight:700;">B</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Verify your email</h1>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
        Enter the code below in Bright-Scraper to complete your registration.
      </p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0a0a0a;">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
        This code expires in 15 minutes. If you didn't sign up for Bright-Scraper, you can ignore this email.
      </p>
    </div>
  `;

  try {
    const gmail = createGmailClient();
    const raw = makeEmailRaw(toEmail, 'Your Bright-Scraper verification code', html);
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    logger.info(`[email] verification sent to ${toEmail}`);
    return { ok: true };
  } catch (err) {
    logger.error(`[email] Gmail API error: ${err.message}`);
    return { error: err.message };
  }
}

async function sendPasswordResetEmail(toEmail, code) {
  if (!process.env.GMAIL_CLIENT_ID) {
    logger.warn(`[email] Gmail API not configured — reset code for ${toEmail}: ${code}`);
    return { ok: true };
  }

  const html = `
    <div style="font-family:sans-serif;max-width:440px;margin:0 auto;padding:40px 24px;">
      <div style="background:#3D7FFC;width:48px;height:48px;border-radius:12px;margin-bottom:24px;text-align:center;line-height:48px;">
        <span style="color:#fff;font-size:22px;font-weight:700;">B</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Reset your password</h1>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
        Use the code below to reset your Bright-Scraper password. It expires in 15 minutes.
      </p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0a0a0a;">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
        If you didn't request a password reset, you can ignore this email.
      </p>
    </div>
  `;

  try {
    const gmail = createGmailClient();
    const raw = makeEmailRaw(toEmail, 'Reset your Bright-Scraper password', html);
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    logger.info(`[email] password reset sent to ${toEmail}`);
    return { ok: true };
  } catch (err) {
    logger.error(`[email] Gmail API error: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
