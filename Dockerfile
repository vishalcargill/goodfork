# Dockerfile for GoodFork (Node.js/Next.js)

FROM node:20-alpine AS base
WORKDIR /app
# Upgrade busybox and related OS packages
RUN apk update && apk add --upgrade busybox=1.37.0-r20 busybox-binsh=1.37.0-r20 ssl_client=1.37.0-r20

FROM base AS deps
COPY package.json ./
RUN npm install

FROM base AS builder
ENV NODE_ENV=production
COPY package.json ./
RUN npm install
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json package-lock.json* ./
EXPOSE 3000
CMD ["npm", "run", "start"]
