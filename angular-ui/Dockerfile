# ─────────────────────────────────────────────
# Stage 1: Build Angular app
# ─────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build for production
COPY . .
RUN npm run build:prod

# ─────────────────────────────────────────────
# Stage 2: Serve with NGINX
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine

LABEL maintainer="example@example.com"
LABEL version="1.0.0"
LABEL description="Angular 21 Hello World UI"

# Remove default NGINX config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from build stage
COPY --from=build /app/dist/helloworld-ui/browser /usr/share/nginx/html

# NGINX runs as non-root by default on port 8080 (for K8s security)
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
