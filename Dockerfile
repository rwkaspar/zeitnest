# ---------- Stage 1: Frontend build ----------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Backend runtime ----------
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/

# Frontend dist aus Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist/

EXPOSE 3001

WORKDIR /app/backend

CMD ["node", "server.js"]
