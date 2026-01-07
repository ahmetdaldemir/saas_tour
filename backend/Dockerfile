FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Docker CLI ve PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    docker.io \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm install sharp@0.34.5 --os=linux --cpu=x64

COPY --from=builder /app/dist ./dist
COPY public ./public
RUN mkdir -p public/uploads
EXPOSE 3000
CMD ["node", "dist/server.js"]
