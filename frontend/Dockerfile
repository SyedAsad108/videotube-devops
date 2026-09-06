# ==========================================
# VideoTube Frontend Multi-Stage Dockerfile
# Node 20 Build -> Nginx Alpine Runtime
# ==========================================

# Stage 1: Build React App
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner

# Clean default html
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx SPA and reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
