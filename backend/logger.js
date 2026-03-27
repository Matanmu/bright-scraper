const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');

function getLogFile() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(logsDir, `${date}.log`);
}

function formatLine(level, message) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${message}\n`;
}

function write(level, message) {
  const line = formatLine(level, message);
  process.stdout.write(line);
  fs.appendFileSync(getLogFile(), line);
}

const logger = {
  info:  (msg) => write('info',  msg),
  warn:  (msg) => write('warn',  msg),
  error: (msg) => write('error', msg),
};

module.exports = logger;
