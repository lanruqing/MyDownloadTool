# Frontend Dockerfile - Multi-stage build
# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app/frontend

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY tsconfig*.json ./
COPY eslint.config.js ./
COPY index.html vite.config.ts ./
COPY src ./src
COPY public ./public

# Build the application
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
