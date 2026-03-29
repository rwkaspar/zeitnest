const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zeitnest API läuft!' });
});

// Start server after DB init
initDatabase().then(() => {
  // Routes (loaded after DB is ready)
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/profiles', require('./routes/profiles'));
  app.use('/api/matches', require('./routes/matches'));
  app.use('/api/messages', require('./routes/messages'));
  app.use('/api/search', require('./routes/search'));

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
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
