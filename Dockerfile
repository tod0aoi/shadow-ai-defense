# Production Dockerfile for Shadow AI Defense Platform
# Compatible with Railway, Render, Fly.io, and Docker
FROM node:22-bookworm-slim

# Install Python 3 for the sensitive data detection engine & AI analyst
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root configuration
COPY package.json ./

# Install backend dependencies
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm install

# Install frontend dependencies
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
RUN cd frontend && npm install

# Copy source code and engines
COPY backend/src ./backend/src
COPY frontend ./frontend
COPY detection-engine ./detection-engine
COPY ai-engine ./ai-engine
COPY database ./database

# Build backend and frontend
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Ensure local offline tailwind script is in build
RUN cp -f frontend/public/tailwindcss.js frontend/build/tailwindcss.js 2>/dev/null || true

# Production configuration
ENV NODE_ENV=production
ENV PORT=5000

# Expose default port
EXPOSE 5000

# Start unified SOC server (serves API and React SPA on $PORT)
CMD ["node", "backend/dist/index.js"]
