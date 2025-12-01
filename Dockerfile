# -------------------------
# Base Image (Debian Slim - No Go packages)
# -------------------------
FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# -------------------------
# Dependencies Layer
# -------------------------
FROM base AS deps

COPY package.json package-lock.json ./

# Install ALL deps (including devDeps)
RUN npm ci

# -------------------------
# Builder Layer
# -------------------------
FROM base AS builder
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -------------------------
# Runner Layer (Final Image)
# -------------------------
FROM base AS runner
ENV NODE_ENV=production

# Copy application dependencies (full)
COPY --from=deps /app/node_modules ./node_modules

# ⚠ Remove devDependencies now (safe because build is already done)
RUN npm prune --omit=dev

# Copy build output & static assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

COPY package.json package-lock.json ./

EXPOSE 3000
CMD ["npm", "run", "start"]
