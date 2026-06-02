const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

async function requireCoordinator(req, res, next) {
  const u = await queryOne('SELECT role, coordination_office_id FROM users WHERE id = $1', [req.user.id]);
  if (!u || u.role !== 'coordinator') {
    return res.status(403).json({ error: 'Koordinator-Zugang erforderlich.' });
  }
  req.coordinatorOfficeId = u.coordination_office_id;
  next();
}

router.use(authenticateToken, requireCoordinator);

// Eigene Stelle inkl. PLZ-Bereich
router.get('/me', async (req, res) => {
  if (!req.coordinatorOfficeId) return res.json({ office: null });
  const office = await queryOne('SELECT * FROM coordination_offices WHERE id = $1', [req.coordinatorOfficeId]);
  res.json({ office });
});

async function loadOfficePrefixes(officeId) {
  if (!officeId) return [];
  const o = await queryOne('SELECT postal_code_prefixes FROM coordination_offices WHERE id = $1', [officeId]);
  return o?.postal_code_prefixes || [];
}

// Helper: Notizen-Map nachladen
async function notesByTarget(officeId, targetType, ids) {
  if (!ids.length) return {};
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
  const rows = await queryAll(
    `SELECT target_id, status, note, updated_at FROM coordinator_notes
       WHERE office_id = $1 AND target_type = $${ids.length + 2} AND target_id IN (${placeholders})`,
    [officeId, ...ids, targetType]
  );
  const map = {};
  for (const r of rows) map[r.target_id] = r;
  return map;
}

// Familien im Bereich (nur die opt-in gegeben haben)
router.get('/families', async (req, res) => {
  const prefixes = await loadOfficePrefixes(req.coordinatorOfficeId);
  if (!prefixes.length) return res.json({ families: [] });
  const placeholders = prefixes.map((_, i) => `$${i + 1}`).join(', ');
  const families = await queryAll(
    `SELECT f.id, f.city, f.postal_code, f.number_of_children, f.children_ages,
            f.desired_grandparent, f.max_distance_km, f.created_at,
            (SELECT json_agg(json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name))
              FROM users u WHERE u.family_id = f.id) AS members
       FROM families f
       WHERE f.visible_to_coordinators = TRUE
         AND f.postal_code IS NOT NULL
         AND substring(f.postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])
       ORDER BY f.created_at DESC LIMIT 200`,
    prefixes
  );
  const noteMap = await notesByTarget(req.coordinatorOfficeId, 'family', families.map((f) => f.id));
  res.json({ families: families.map((f) => ({ ...f, _note: noteMap[f.id] || null })) });
});

// Wunschgroßeltern im Bereich (nur die opt-in gegeben haben)
router.get('/grandparents', async (req, res) => {
  const prefixes = await loadOfficePrefixes(req.coordinatorOfficeId);
  if (!prefixes.length) return res.json({ grandparents: [] });
  const placeholders = prefixes.map((_, i) => `$${i + 1}`).join(', ');
  const grandparents = await queryAll(
    `SELECT u.id, u.first_name, u.last_name, u.city, u.postal_code, u.bio, u.avatar_url,
            u.created_at, u.birth_date, u.mobility,
            gp.experience, gp.preferred_age_range, gp.activities,
            (gp.fz_status = 'verified' AND (gp.fz_expires_at IS NULL OR gp.fz_expires_at > NOW())) AS fz_verified,
            gp.fz_expires_at
       FROM users u
       JOIN grandparent_profiles gp ON u.id = gp.user_id
       WHERE u.role = 'grandparent'
         AND gp.visible_to_coordinators = TRUE
         AND u.postal_code IS NOT NULL
         AND substring(u.postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])
       ORDER BY u.created_at DESC LIMIT 200`,
    prefixes
  );
  const noteMap = await notesByTarget(req.coordinatorOfficeId, 'grandparent', grandparents.map((g) => g.id));
  res.json({ grandparents: grandparents.map((g) => ({ ...g, _note: noteMap[g.id] || null })) });
});

// Statistik-Karten
router.get('/stats', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  if (!officeId) return res.json({ families: 0, grandparents: 0, fz_verified: 0, in_contact: 0, matched: 0 });
  const prefixes = await loadOfficePrefixes(officeId);
  if (!prefixes.length) return res.json({ families: 0, grandparents: 0, fz_verified: 0, in_contact: 0, matched: 0 });

  const placeholders = prefixes.map((_, i) => `$${i + 1}`).join(', ');
  const fam = await queryOne(
    `SELECT COUNT(*)::int AS c FROM families
       WHERE visible_to_coordinators = TRUE AND postal_code IS NOT NULL
         AND substring(postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])`,
    prefixes
  );
  const gp = await queryOne(
    `SELECT COUNT(*)::int AS c FROM users u JOIN grandparent_profiles gp ON gp.user_id = u.id
       WHERE u.role = 'grandparent' AND gp.visible_to_coordinators = TRUE AND u.postal_code IS NOT NULL
         AND substring(u.postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])`,
    prefixes
  );
  const fz = await queryOne(
    `SELECT COUNT(*)::int AS c FROM users u JOIN grandparent_profiles gp ON gp.user_id = u.id
       WHERE u.role = 'grandparent' AND gp.visible_to_coordinators = TRUE
         AND gp.fz_status = 'verified' AND (gp.fz_expires_at IS NULL OR gp.fz_expires_at > NOW())
         AND u.postal_code IS NOT NULL
         AND substring(u.postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])`,
    prefixes
  );
  const noteStats = await queryAll(
    `SELECT status, COUNT(*)::int AS c FROM coordinator_notes WHERE office_id = $1 GROUP BY status`,
    [officeId]
  );
  const byStatus = Object.fromEntries(noteStats.map((r) => [r.status, r.c]));

  res.json({
    families: fam.c, grandparents: gp.c, fz_verified: fz.c,
    in_contact: byStatus.in_contact || 0,
    matched: byStatus.matched || 0,
  });
});

// Notiz upsert
router.put('/notes/:targetType/:targetId', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  if (!officeId) return res.status(400).json({ error: 'Keine Stelle zugeordnet.' });
  const { targetType, targetId } = req.params;
  if (!['family', 'grandparent'].includes(targetType)) {
    return res.status(400).json({ error: 'Ungültiger targetType.' });
  }
  const { status, note } = req.body;
  const allowedStatus = ['new', 'in_contact', 'matched', 'paused'];
  const finalStatus = allowedStatus.includes(status) ? status : 'new';

  const existing = await queryOne(
    `SELECT id FROM coordinator_notes WHERE office_id = $1 AND target_type = $2 AND target_id = $3`,
    [officeId, targetType, targetId]
  );
  if (existing) {
    await runSql(
      `UPDATE coordinator_notes SET status = $1, note = $2, updated_at = NOW() WHERE id = $3`,
      [finalStatus, note || null, existing.id]
    );
  } else {
    await runSql(
      `INSERT INTO coordinator_notes (id, office_id, target_type, target_id, status, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), officeId, targetType, targetId, finalStatus, note || null]
    );
  }
  res.json({ status: finalStatus, note: note || null });
});

// ===== Event-Kalender =====

router.get('/events', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  if (!officeId) return res.json({ events: [] });
  const events = await queryAll(
    `SELECT e.*,
       (SELECT COUNT(*)::int FROM coordinator_event_attendances a WHERE a.event_id = e.id AND a.status = 'going') AS going_count,
       (SELECT COUNT(*)::int FROM coordinator_event_attendances a WHERE a.event_id = e.id AND a.status = 'interested') AS interested_count
     FROM coordinator_events e
     WHERE e.office_id = $1
     ORDER BY e.start_at DESC LIMIT 200`,
    [officeId]
  );
  res.json({ events });
});

router.get('/events/:id', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  if (!officeId) return res.status(404).json({ error: 'Keine Stelle.' });
  const event = await queryOne(
    `SELECT * FROM coordinator_events WHERE id = $1 AND office_id = $2`,
    [req.params.id, officeId]
  );
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden.' });
  const attendees = await queryAll(
    `SELECT a.user_id, a.status, a.created_at,
            u.first_name, u.last_name, u.email, u.role, u.avatar_url
       FROM coordinator_event_attendances a
       JOIN users u ON u.id = a.user_id
       WHERE a.event_id = $1
       ORDER BY a.status ASC, a.created_at ASC`,
    [req.params.id]
  );
  res.json({ ...event, attendees });
});

router.post('/events', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  if (!officeId) return res.status(400).json({ error: 'Keine Stelle.' });
  const { title, description, location, start_at, end_at, capacity, audience } = req.body;
  if (!title || !start_at || !end_at) {
    return res.status(400).json({ error: 'Titel, Start und Ende sind Pflicht.' });
  }
  const allowedAudience = ['parents', 'grandparents', 'both'];
  const aud = allowedAudience.includes(audience) ? audience : 'both';
  const id = uuidv4();
  await runSql(
    `INSERT INTO coordinator_events (id, office_id, title, description, location, start_at, end_at, capacity, audience)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, officeId, title.trim(), description || null, location || null, start_at, end_at,
     Number.isFinite(parseInt(capacity)) ? parseInt(capacity) : null, aud]
  );
  res.status(201).json({ id });
});

router.put('/events/:id', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  const event = await queryOne(`SELECT * FROM coordinator_events WHERE id = $1 AND office_id = $2`, [req.params.id, officeId]);
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden.' });
  const { title, description, location, start_at, end_at, capacity, audience } = req.body;
  const allowedAudience = ['parents', 'grandparents', 'both'];
  const aud = allowedAudience.includes(audience) ? audience : event.audience;
  await runSql(
    `UPDATE coordinator_events SET
       title = COALESCE($1, title),
       description = $2,
       location = $3,
       start_at = COALESCE($4, start_at),
       end_at = COALESCE($5, end_at),
       capacity = $6,
       audience = $7,
       updated_at = NOW()
     WHERE id = $8`,
    [title?.trim() || null, description || null, location || null, start_at || null, end_at || null,
     Number.isFinite(parseInt(capacity)) ? parseInt(capacity) : null, aud, req.params.id]
  );
  res.json({ message: 'Event aktualisiert.' });
});

router.delete('/events/:id', async (req, res) => {
  const officeId = req.coordinatorOfficeId;
  const event = await queryOne(`SELECT id FROM coordinator_events WHERE id = $1 AND office_id = $2`, [req.params.id, officeId]);
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden.' });
  await runSql(`DELETE FROM coordinator_events WHERE id = $1`, [req.params.id]);
  res.json({ message: 'Event gelöscht.' });
});

module.exports = router;
