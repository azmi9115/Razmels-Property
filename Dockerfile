# 1. Base Image
FROM node:20-slim AS base
# Ensure openssl is installed just in case Prisma needs it on slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 2. Builder Stage
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set fetch-retry-maxtimeout 120000 && npm config set fetch-retry-mintimeout 20000 && npm install --network-timeout=1000000 || npm install || npm install

COPY . .
# Generate Prisma Client
RUN npx prisma generate

# Dummy DB URL to satisfy Prisma during Next.js static generation
ENV DATABASE_URL="file:./dev.db"

# Build Next.js App
RUN npm run build

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Setup entrypoint script
RUN echo -e '#!/bin/sh\n\
sqlite3 prisma/dev.db "PRAGMA journal_mode=WAL;"\n\
# Pastikan database sinkron saat container nyala\n\
npx prisma db push --accept-data-loss\n\
npm start\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]
