# ==========================================
# VideoTube Backend Multi-Stage Dockerfile
# Optimized for Node.js 20 on Alpine Linux
# ==========================================

# Stage 1: Build & Native Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for container healthchecks
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=8000

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Copy application source code
COPY app.js index.js ./
COPY constants.js ./
COPY src/ ./src/
COPY public/ ./public/

# Ensure upload temp directory exists with proper permissions
RUN mkdir -p public/temp && chown -R node:node public/temp

# Run as non-privileged user
USER node

EXPOSE 8000

# Healthcheck against the centralized healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/healthcheck || exit 1

CMD ["node", "index.js"]
