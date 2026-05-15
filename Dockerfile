# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
# Copy prisma schema BEFORE install so the postinstall (prisma generate) succeeds
COPY prisma ./prisma
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY api ./api

# Compile TypeScript (prisma generate already ran in postinstall above)
RUN yarn build

# ── Stage 2: production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./
# --ignore-scripts skips postinstall (prisma generate) — schema not needed here;
# we copy the already-generated .prisma client from the builder instead
RUN yarn install --production --ignore-scripts

# Copy compiled output and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["node", "dist/src/server.js"]
