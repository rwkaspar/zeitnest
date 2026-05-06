const express = require('express');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

async function requireAdmin(req, res, next) {
  const u = await queryOne('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
  if (!u?.is_admin) return res.status(403).json({ error: 'Admin-Berechtigung erforderlich.' });
  next();
}

router.use(authenticateToken, requireAdmin);

router.get('/stats', async (req, res) => {
  const stats = await queryOne(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE is_demo = FALSE) as users,
      (SELECT COUNT(*) FROM users WHERE role = 'parent' AND is_demo = FALSE) as parents,
      (SELECT COUNT(*) FROM users WHERE role = 'grandparent' AND is_demo = FALSE) as grandparents,
      (SELECT COUNT(*) FROM users WHERE email_verified = FALSE) as unverified,
      (SELECT COUNT(*) FROM matches) as matches,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as bookings,
      (SELECT COUNT(*) FROM reports WHERE status = 'open') as open_reports
  `);
  res.json(stats);
});

router.get('/reports', async (req, res) => {
  const reports = await queryAll(`
    SELECT r.*,
      reporter.email as reporter_email, reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name,
      reported.email as reported_email, reported.first_name as reported_first_name, reported.last_name as reported_last_name
    FROM reports r
    JOIN users reporter ON r.reporter_id = reporter.id
    JOIN users reported ON r.reported_id = reported.id
    ORDER BY r.created_at DESC
    LIMIT 100
  `);
  res.json(reports);
});

router.put('/reports/:id', async (req, res) => {
  const { status } = req.body;
  if (!['open', 'reviewed', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status.' });
  }
  await runSql('UPDATE reports SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ message: 'Status aktualisiert.' });
});

router.get('/users', async (req, res) => {
  const users = await queryAll(`
    SELECT id, email, role, first_name, last_name, city, email_verified, is_demo, is_admin, totp_enabled, created_at
    FROM users ORDER BY created_at DESC LIMIT 200
  `);
  res.json(users);
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Sie können sich nicht selbst löschen.' });
  await runSql('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ message: 'Benutzer gelöscht.' });
});

module.exports = router;
