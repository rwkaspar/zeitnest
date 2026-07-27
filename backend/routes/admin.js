const express = require('express');
const path = require('path');
const fs = require('fs');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const FZ_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'fz');

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

// ===== Führungszeugnis-Prüfungen =====

router.get('/fz/pending', async (req, res) => {
  const rows = await queryAll(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.city,
      gp.fz_status, gp.fz_submitted_at, gp.fz_verified_at, gp.fz_expires_at, gp.fz_admin_note
    FROM users u
    JOIN grandparent_profiles gp ON u.id = gp.user_id
    WHERE gp.fz_status IN ('pending', 'rejected')
    ORDER BY gp.fz_submitted_at DESC NULLS LAST
    LIMIT 200
  `);
  res.json(rows);
});

router.get('/fz/:userId/file', async (req, res) => {
  const row = await queryOne('SELECT fz_filename FROM grandparent_profiles WHERE user_id = $1', [req.params.userId]);
  if (!row?.fz_filename) return res.status(404).json({ error: 'Keine Datei.' });
  const filePath = path.join(FZ_UPLOAD_DIR, row.fz_filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Datei nicht im Speicher.' });
  res.sendFile(filePath);
});

router.patch('/fz/:userId', async (req, res) => {
  const { action, note } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action muss approve oder reject sein.' });
  }
  const row = await queryOne('SELECT fz_filename FROM grandparent_profiles WHERE user_id = $1', [req.params.userId]);
  if (!row) return res.status(404).json({ error: 'User nicht gefunden.' });

  if (action === 'approve') {
    // 3 Jahre Gültigkeit, Datei nach Verifizierung löschen, Reminder-Flags zurücksetzen
    const validityYears = parseInt(process.env.FZ_VALIDITY_YEARS) || 3;
    await runSql(
      `UPDATE grandparent_profiles
       SET fz_status = 'verified',
           fz_verified_at = NOW(),
           fz_expires_at = NOW() + ($1 || ' years')::INTERVAL,
           fz_admin_note = NULL,
           fz_filename = NULL,
           fz_reminder_60d_sent_at = NULL,
           fz_reminder_7d_sent_at = NULL
       WHERE user_id = $2`,
      [validityYears, req.params.userId]
    );
    if (row.fz_filename) {
      fs.unlink(path.join(FZ_UPLOAD_DIR, row.fz_filename), () => {});
    }
    console.log(`[FZ] approved user=${req.params.userId} by=${req.user.id}`);
  } else {
    await runSql(
      `UPDATE grandparent_profiles
       SET fz_status = 'rejected',
           fz_admin_note = $1,
           fz_filename = NULL
       WHERE user_id = $2`,
      [note || null, req.params.userId]
    );
    if (row.fz_filename) {
      fs.unlink(path.join(FZ_UPLOAD_DIR, row.fz_filename), () => {});
    }
    console.log(`[FZ] rejected user=${req.params.userId} by=${req.user.id} note="${note || ''}"`);
  }
  res.json({ message: 'Status aktualisiert.' });
});

module.exports = router;
