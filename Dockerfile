# ============================================
# Synergo Docker Image
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine AS production

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    # Clean up build dependencies after npm install
    apk del python3 make g++ && \
    rm -rf /root/.npm /root/.node-gyp

# Copy server files
COPY server ./server

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Create directories for data persistence
# These will be mounted as volumes in production
RUN mkdir -p /app/data /app/resources

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/synergo.db
ENV RESOURCES_PATH=/app/resources

# Expose the API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "server/index.js"]
