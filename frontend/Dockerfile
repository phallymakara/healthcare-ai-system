# ==============================================
# Stage 1: Build the React application
# ==============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Optional build arguments for custom API/WebSocket URLs if needed
ARG VITE_API_BASE_URL=""
ARG VITE_WS_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

# Copy source code
COPY . .

# Build for production
# In production mode, api.ts dynamically uses window.location.origin (no hardcoded URLs)
RUN npm run build

# ==============================================
# Stage 2: Serve with Nginx + reverse proxy
# ==============================================
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on port 80 inside the container
EXPOSE 80

# Native healthcheck using built-in wget
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
