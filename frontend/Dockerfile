FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# bust cache: 2026-03-30e
ENV REACT_APP_API_URL=https://backend-production-8af2d.up.railway.app
ENV REACT_APP_ADMIN_EMAILS=matanmu@gmail.com
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN npm install express
COPY --from=builder /app/build ./build
COPY server.js ./server.js
CMD ["node", "server.js"]
