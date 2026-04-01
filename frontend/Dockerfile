FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept build-time env vars (can be overridden via docker-compose build args)
ARG REACT_APP_API_URL=http://localhost:5001
ARG REACT_APP_ADMIN_EMAILS=
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ADMIN_EMAILS=$REACT_APP_ADMIN_EMAILS

RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN npm install express
COPY --from=builder /app/build ./build
COPY server.js ./server.js
EXPOSE 3000
CMD ["node", "server.js"]
