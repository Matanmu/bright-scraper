FROM node:20-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create data directory for SQLite
RUN mkdir -p data

EXPOSE 5001

CMD ["node", "server.js"]