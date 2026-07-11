# Driftlands game server — Coolify / Docker
# Build context: repo root
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY contracts/package.json ./contracts/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY . .
RUN pnpm --filter @driftlands/shared build
WORKDIR /app/server
RUN pnpm exec prisma generate
RUN pnpm exec tsc -p tsconfig.json

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:/data/driftlands.db
ENV DEMO_MODE=true
RUN addgroup -S nodejs && adduser -S drift -G nodejs \
  && mkdir -p /data && chown drift:nodejs /data
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/package.json ./package.json
WORKDIR /app/server
USER drift
EXPOSE 4000
CMD ["sh", "-c", "../node_modules/.bin/prisma db push --skip-generate && node dist/index.js"]
