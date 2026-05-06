const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create a review for a match (only after match is accepted/completed)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { match_id, rating, comment } = req.body;
    if (!match_id || !rating) return res.status(400).json({ error: 'Match-ID und Bewertung erforderlich.' });

    const r = parseInt(rating);
    if (r < 1 || r > 5) return res.status(400).json({ error: 'Bewertung muss zwischen 1 und 5 liegen.' });

    const match = await queryOne('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (!match) return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
    if (match.parent_id !== req.user.id && match.grandparent_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }
    if (match.status !== 'accepted' && match.status !== 'completed') {
      return res.status(400).json({ error: 'Bewertung nur nach angenommener Anfrage möglich.' });
    }

    const reviewedId = match.parent_id === req.user.id ? match.grandparent_id : match.parent_id;

    const existing = await queryOne('SELECT id FROM reviews WHERE match_id = $1 AND reviewer_id = $2', [match_id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Sie haben diese Person bereits bewertet.' });

    const id = uuidv4();
    const trimmedComment = comment ? String(comment).trim().substring(0, 1000) : null;
    await runSql(
      'INSERT INTO reviews (id, match_id, reviewer_id, reviewed_id, rating, comment) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, match_id, req.user.id, reviewedId, r, trimmedComment]
    );

    res.status(201).json({ id, rating: r, comment: trimmedComment });
  } catch (err) {
    console.error('Create review error:', err.message);
    res.status(500).json({ error: 'Bewertung fehlgeschlagen.' });
  }
});

// Get reviews for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const reviews = await queryAll(`
      SELECT r.*, u.first_name, u.last_name FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewed_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.userId]);
    res.json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err.message);
    res.status(500).json({ error: 'Fehler beim Laden.' });
  }
});

module.exports = router;
