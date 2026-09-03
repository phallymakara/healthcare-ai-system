# ==============================================
# Stage 1: Build the React application
# ==============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build for production
# In production mode, api.ts will use window.location.origin (no hardcoded URLs)
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

CMD ["nginx", "-g", "daemon off;"]
