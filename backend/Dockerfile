FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Docker CLI ve PostgreSQL client yükle (Docker socket ve pg_dump için)
RUN apk add --no-cache docker-cli postgresql-client

COPY package*.json ./
# Production dependencies only (dev dependencies excluded for security)
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
# Public klasörünü kopyala (widget.js için)
COPY public ./public
# Uploads klasörünü oluştur (user-uploaded files için)
RUN mkdir -p public/uploads
EXPOSE 3000
CMD ["node", "dist/server.js"]
