FROM node:20-alpine

WORKDIR /app

# Copy package files and install
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy frontend dist (pre-built)
COPY frontend/dist/ ./frontend/dist/

EXPOSE 3001

WORKDIR /app/backend

CMD ["node", "server.js"]
