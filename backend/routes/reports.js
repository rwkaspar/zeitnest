const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const VALID_REASONS = ['spam', 'fake_profile', 'inappropriate_content', 'harassment', 'safety_concern', 'other'];

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reported_id, reason, details } = req.body;
    if (!reported_id || !reason) return res.status(400).json({ error: 'Benutzer und Grund erforderlich.' });
    if (!VALID_REASONS.includes(reason)) return res.status(400).json({ error: 'Ungültiger Grund.' });
    if (reported_id === req.user.id) return res.status(400).json({ error: 'Sie können sich nicht selbst melden.' });

    const target = await queryOne('SELECT id FROM users WHERE id = $1', [reported_id]);
    if (!target) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });

    const trimmedDetails = details ? String(details).trim().substring(0, 2000) : null;
    const id = uuidv4();
    await runSql(
      'INSERT INTO reports (id, reporter_id, reported_id, reason, details) VALUES ($1, $2, $3, $4, $5)',
      [id, req.user.id, reported_id, reason, trimmedDetails]
    );
    res.status(201).json({ id, message: 'Meldung wurde übermittelt. Vielen Dank für Ihren Hinweis.' });
  } catch (err) {
    console.error('Create report error:', err.message);
    res.status(500).json({ error: 'Meldung fehlgeschlagen.' });
  }
});

module.exports = router;
