const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// App läuft hinter Cloudflare Tunnel + nginx: ohne trust proxy sähen alle
// Nutzer wie eine IP aus und teilten sich JEDES Rate-Limit-Budget (inkl. Login).
// Der Port ist nicht öffentlich exponiert (nur Tunnel), daher ist das sicher.
app.set('trust proxy', true);

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
  // Feedback-Widget: strenges Limit — öffentlicher Endpoint mit externen
  // Seiteneffekten (KI-Aufruf + GitHub-Issue).
  const feedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Zu viele Meldungen. Bitte versuchen Sie es später erneut.' },
  });
  app.use('/api/feedback', feedbackLimiter, require('./routes/feedback'));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/profiles', require('./routes/profiles'));
  app.use('/api/families', require('./routes/families'));
  app.use('/api/coordinator', require('./routes/coordinator'));
  app.use('/api/events', require('./routes/events'));
  app.use('/api/matches', require('./routes/matches'));
  app.use('/api/messages', require('./routes/messages'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/calendar', require('./routes/calendar'));
  app.use('/api/reviews', require('./routes/reviews'));
  app.use('/api/reports', require('./routes/reports'));
  app.use('/api/2fa', require('./routes/twofactor'));
  app.use('/api/admin', require('./routes/admin'));

  // Serve frontend in production
  const frontendPath = path.join(__dirname, '../frontend/dist');
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    // Hashed Bundles (assets/*) dürfen lange gecached werden,
    // alles andere (index.html, favicon, logos) muss frisch geladen werden,
    // sonst sehen User nach Deploys die alte Version.
    app.use(express.static(frontendPath, {
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          // Vite-Bundle hat Content-Hash im Namen — immutable cache 1 Jahr.
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // index.html, favicon.svg, logo.png, illustrations/* — keine Cache,
          // damit neue Deploys sofort sichtbar sind.
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }

  // Wartungs-Jobs (FZ-Ablauf + Erinnerungs-Mails)
  require('./maintenance/fzLifecycle').startFzLifecycleScheduler();

  app.listen(PORT, () => {
    console.log(`Zeitnest-Server laeuft auf Port ${PORT}`);
  });
}).catch(err => {
  console.error('Datenbankfehler:', err.message);
  process.exit(1);
});
