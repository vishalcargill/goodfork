# -------------------------
# Base Image (Debian Slim - No Go)
# -------------------------

FROM node:20-slim AS base
WORKDIR /app
# Create a non-root user with UID 999
RUN useradd --uid 999 --user-group --system --shell /bin/bash app
USER 999

# Install essential system packages for build tools, Prisma, and Next.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    libssl-dev \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with UID 999
RUN useradd --uid 999 --user-group --system --shell /bin/bash app

# -------------------------
# Dependencies Layer
# -------------------------
FROM base AS deps

COPY package.json package-lock.json ./

# Install ALL deps (includes devDependencies)
RUN npm ci

# -------------------------
# Builder Layer
# -------------------------
FROM base AS builder
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only minimal runtime packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Copy built node_modules
COPY --from=deps /app/node_modules ./node_modules

# Remove development-only dependencies (safe after build)
RUN npm prune --omit=dev

# Copy final build outputs
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
