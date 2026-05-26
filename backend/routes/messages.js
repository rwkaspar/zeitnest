const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendNewMessageEmail } = require('../utils/mail');

const router = express.Router();

router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await queryOne(`
      SELECT COUNT(*) as count FROM messages m
      JOIN matches mt ON m.match_id = mt.id
      WHERE m.sender_id != $1 AND m.read = FALSE AND (mt.parent_id = $2 OR mt.grandparent_id = $3)
    `, [req.user.id, req.user.id, req.user.id]);
    res.json({ unread: parseInt(count?.count) || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Fehler.' });
  }
});

router.get('/:matchId', authenticateToken, async (req, res) => {
  try {
    const match = await queryOne('SELECT * FROM matches WHERE id = $1', [req.params.matchId]);
    if (!match) return res.status(404).json({ error: 'Konversation nicht gefunden.' });
    if (match.parent_id !== req.user.id && match.grandparent_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }

    const messages = await queryAll(`
      SELECT m.*, u.first_name, u.last_name FROM messages m
      JOIN users u ON m.sender_id = u.id WHERE m.match_id = $1 ORDER BY m.created_at ASC
    `, [req.params.matchId]);

    await runSql('UPDATE messages SET read = TRUE WHERE match_id = $1 AND sender_id != $2', [req.params.matchId, req.user.id]);

    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Nachrichten.' });
  }
});

router.post('/:matchId', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' });

    const match = await queryOne('SELECT * FROM matches WHERE id = $1', [req.params.matchId]);
    if (!match) return res.status(404).json({ error: 'Konversation nicht gefunden.' });
    if (match.parent_id !== req.user.id && match.grandparent_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }
    if (match.status !== 'accepted') {
      return res.status(400).json({ error: 'Nachrichten können erst nach Annahme der Anfrage gesendet werden.' });
    }

    const id = uuidv4();
    await runSql('INSERT INTO messages (id, match_id, sender_id, content) VALUES ($1, $2, $3, $4)', [id, req.params.matchId, req.user.id, content.trim()]);

    // Notify the other party (only if there are no other unread messages already in this conversation, to avoid spam)
    const otherId = match.parent_id === req.user.id ? match.grandparent_id : match.parent_id;
    const recentUnread = await queryOne(
      `SELECT COUNT(*) as c FROM messages WHERE match_id = $1 AND sender_id = $2 AND read = FALSE AND id != $3`,
      [req.params.matchId, req.user.id, id]
    );
    if (parseInt(recentUnread?.c) === 0) {
      const sender = await queryOne('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
      const recipient = await queryOne('SELECT email, first_name FROM users WHERE id = $1', [otherId]);
      if (sender && recipient) {
        sendNewMessageEmail(recipient.email, recipient.first_name, `${sender.first_name} ${sender.last_name}`, req.params.matchId)
          .catch(err => console.error('Message notification email failed:', err.message));
      }
    }

    res.status(201).json({ id, match_id: req.params.matchId, sender_id: req.user.id, content: content.trim(), created_at: new Date().toISOString() });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden.' });
  }
});

// PUT /messages/:id — eigene Nachricht bearbeiten (innerhalb 15 Min)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' });

    const msg = await queryOne('SELECT * FROM messages WHERE id = $1', [req.params.id]);
    if (!msg) return res.status(404).json({ error: 'Nachricht nicht gefunden.' });
    if (msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Nur eigene Nachrichten bearbeitbar.' });

    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    if (ageMs > 15 * 60 * 1000) {
      return res.status(400).json({ error: 'Bearbeitung nur innerhalb von 15 Minuten möglich.' });
    }

    await runSql('UPDATE messages SET content = $1, edited_at = NOW() WHERE id = $2', [content.trim(), req.params.id]);
    res.json({ id: req.params.id, content: content.trim(), edited_at: new Date().toISOString() });
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ error: 'Bearbeitung fehlgeschlagen.' });
  }
});

// DELETE /messages/:id — eigene Nachricht löschen (innerhalb 15 Min)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const msg = await queryOne('SELECT * FROM messages WHERE id = $1', [req.params.id]);
    if (!msg) return res.status(404).json({ error: 'Nachricht nicht gefunden.' });
    if (msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Nur eigene Nachrichten löschbar.' });

    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    if (ageMs > 15 * 60 * 1000) {
      return res.status(400).json({ error: 'Löschen nur innerhalb von 15 Minuten möglich.' });
    }

    await runSql('DELETE FROM messages WHERE id = $1', [req.params.id]);
    res.json({ message: 'Gelöscht.' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Löschen fehlgeschlagen.' });
  }
});

module.exports = router;
