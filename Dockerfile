# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app directory and set permissions
RUN mkdir -p /app && chown -R node:node /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=node:node src/ ./src/

# Create non-root user for security
USER node

# Expose port (use environment variable or default)
EXPOSE ${PORT:-8000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-8000}/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]
