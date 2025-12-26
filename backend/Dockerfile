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

# Docker CLI yükle (Docker socket üzerinden erişim için)
RUN apk add --no-cache docker-cli

COPY package*.json ./
# Production'da script'lerin çalıştırılabilmesi için ts-node gerekli
# Bu yüzden dev dependencies'i de yüklüyoruz
RUN npm install
COPY --from=builder /app/dist ./dist
# Script'lerin container içinden npm run ile çalıştırılabilmesi için src'yi de kopyala
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["node", "dist/server.js"]
