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

# Docker CLI, PostgreSQL client ve sharp için gerekli native dependencies
RUN apk add --no-cache docker-cli postgresql-client vips-dev

COPY package*.json ./

# Production dependencies - sharp için platform-spesifik install
RUN npm ci --omit=dev --include=optional

COPY --from=builder /app/dist ./dist
COPY public ./public
RUN mkdir -p public/uploads
EXPOSE 3000
CMD ["node", "dist/server.js"]
