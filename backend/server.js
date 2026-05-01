const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // handled by nginx/frontend SPA
  crossOriginEmbedderPolicy: false,
}));

// CORS - only allow same origin (frontend served from same server)
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  credentials: true,
}));

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
});
app.use('/api/', generalLimiter);

// Strict rate limit for unauthenticated auth endpoints (login, register, forgot/reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.' },
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server after DB init
initDatabase().then(() => {
  // Routes (loaded after DB is ready)
  // Apply strict limiter only to unauthenticated auth endpoints
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
  app.use('/api/auth/reset-password', authLimiter);
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/profiles', require('./routes/profiles'));
  app.use('/api/matches', require('./routes/matches'));
  app.use('/api/messages', require('./routes/messages'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/calendar', require('./routes/calendar'));

  // Serve frontend in production
  const frontendPath = path.join(__dirname, '../frontend/dist');
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Zeitnest-Server laeuft auf Port ${PORT}`);
  });
}).catch(err => {
  console.error('Datenbankfehler:', err.message);
  process.exit(1);
});
