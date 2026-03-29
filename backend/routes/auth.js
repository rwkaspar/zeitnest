const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryOne, runSql } = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, role, first_name, last_name, city, postal_code } = req.body;
    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ error: 'Bitte alle Pflichtfelder ausfüllen.' });
    }
    if (!['parent', 'grandparent'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle.' });
    }
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    runSql(`INSERT INTO users (id, email, password, role, first_name, last_name, city, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, email, hashedPassword, role, first_name, last_name, city || null, postal_code || null]);

    if (role === 'parent') {
      runSql(`INSERT INTO parent_profiles (user_id) VALUES (?)`, [id]);
    } else {
      runSql(`INSERT INTO grandparent_profiles (user_id) VALUES (?)`, [id]);
    }

    const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, email, role, first_name, last_name, city, postal_code } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Bitte E-Mail und Passwort eingeben.' });
    }
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name, city: user.city, postal_code: user.postal_code, bio: user.bio, avatar_url: user.avatar_url }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Anmeldung fehlgeschlagen.' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = queryOne('SELECT id, email, role, first_name, last_name, city, postal_code, phone, bio, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });

    let profile = null;
    if (user.role === 'parent') {
      profile = queryOne('SELECT * FROM parent_profiles WHERE user_id = ?', [user.id]);
    } else {
      profile = queryOne('SELECT * FROM grandparent_profiles WHERE user_id = ?', [user.id]);
    }
    res.json({ ...user, profile });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Fehler beim Laden des Profils.' });
  }
});

module.exports = router;
