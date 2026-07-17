# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app/backend

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including dev for build)
RUN npm install

# Copy source code
COPY src ./src
COPY tsconfig.json ./
# .env file will be copied only if it exists in the build context
COPY .env* ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
