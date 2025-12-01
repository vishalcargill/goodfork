# -------------------------
# Base Image (Debian Slim - No Go packages)
# -------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install required packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# -------------------------
# Dependencies Layer
# -------------------------
FROM base AS deps

# Copy lockfile & manifest (required for npm ci)
COPY package.json package-lock.json ./

# Deterministic install (fixes Sysdig CVEs)
RUN npm ci --omit=dev

# -------------------------
# Builder Layer
# -------------------------
FROM base AS builder
ENV NODE_ENV=production

# Copy manifest and lockfile again
COPY package.json package-lock.json ./

# Copy node_modules from deps layer
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build Next.js
RUN npm run build

# -------------------------
# Runner Layer (Final image)
# -------------------------
FROM base AS runner
ENV NODE_ENV=production

# Copy runtime node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy Next.js build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy only what is needed at runtime
COPY package.json package-lock.json ./

EXPOSE 3000
CMD ["npm", "run", "start"]
