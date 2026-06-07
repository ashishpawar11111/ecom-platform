# ── Stage 1: install production deps ──────────────────────────────────────────
# Separate stage so npm ci is cached until package.json changes.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# ── Stage 2: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user — never run as root in production
RUN addgroup -S ecom && adduser -S ecom -G ecom
USER ecom

COPY --from=deps --chown=ecom:ecom /app/node_modules ./node_modules
COPY --chown=ecom:ecom src/ ./src/

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/db || exit 1

CMD ["node", "src/index.js"]
