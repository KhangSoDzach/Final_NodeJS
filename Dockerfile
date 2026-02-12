# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Build frontend if exists
RUN npm run frontend:build || echo "No frontend build step"

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built app from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/views ./views
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/controllers ./controllers
COPY --from=builder /usr/src/app/models ./models
COPY --from=builder /usr/src/app/middleware ./middleware
COPY --from=builder /usr/src/app/config ./config
COPY --from=builder /usr/src/app/utils ./utils
COPY --from=builder /usr/src/app/locales ./locales
COPY --from=builder /usr/src/app/app.js ./

# Create upload directories (will be mounted as volume)
RUN mkdir -p uploads/products && \
    chown -R node:node /usr/src/app

# Use non-root user
USER node

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Command to run the application
CMD ["node", "app.js"]
