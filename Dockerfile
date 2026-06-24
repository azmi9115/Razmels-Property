# 1. Base Image
FROM node:20-slim AS base
# Ensure openssl is installed just in case Prisma needs it on slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 2. Builder Stage
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build Next.js App
RUN npm run build

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

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
# Pastikan database sinkron saat container nyala\n\
npx prisma db push --accept-data-loss\n\
npm start\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]
