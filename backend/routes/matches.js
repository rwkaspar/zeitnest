const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { target_id, message } = req.body;
    if (!target_id) return res.status(400).json({ error: 'Ziel-Benutzer fehlt.' });

    const target = await queryOne('SELECT id, role FROM users WHERE id = $1', [target_id]);
    if (!target) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });

    let parent_id, grandparent_id;
    if (req.user.role === 'parent') { parent_id = req.user.id; grandparent_id = target_id; }
    else { parent_id = target_id; grandparent_id = req.user.id; }

    const existing = await queryOne('SELECT id FROM matches WHERE parent_id = $1 AND grandparent_id = $2 AND status != $3', [parent_id, grandparent_id, 'declined']);
    if (existing) return res.status(409).json({ error: 'Es besteht bereits eine Anfrage.' });

    const id = uuidv4();
    await runSql(`INSERT INTO matches (id, parent_id, grandparent_id, status, message) VALUES ($1, $2, $3, 'pending', $4)`, [id, parent_id, grandparent_id, message || null]);

    res.status(201).json({ id, status: 'pending', message: 'Anfrage gesendet!' });
  } catch (err) {
    console.error('Create match error:', err);
    res.status(500).json({ error: 'Anfrage konnte nicht gesendet werden.' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const matches = await queryAll(`
      SELECT m.*, p.first_name as parent_first_name, p.last_name as parent_last_name, p.city as parent_city, p.avatar_url as parent_avatar,
        g.first_name as grandparent_first_name, g.last_name as grandparent_last_name, g.city as grandparent_city, g.avatar_url as grandparent_avatar
      FROM matches m JOIN users p ON m.parent_id = p.id JOIN users g ON m.grandparent_id = g.id
      WHERE m.parent_id = $1 OR m.grandparent_id = $2 ORDER BY m.updated_at DESC
    `, [req.user.id, req.user.id]);

    res.json(matches);
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Anfragen.' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status.' });
    }
    const match = await queryOne('SELECT * FROM matches WHERE id = $1', [req.params.id]);
    if (!match) return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
    if (match.parent_id !== req.user.id && match.grandparent_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }
    await runSql('UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Status aktualisiert.', status });
  } catch (err) {
    console.error('Update match error:', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
});

module.exports = router;
