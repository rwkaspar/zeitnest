// Eltern/Wunschgroßeltern-seitige Endpoints für Koordinierungs-Veranstaltungen.
// Sichtbarkeit: nur User, die visible_to_coordinators=TRUE gesetzt haben, sehen
// Events von Stellen in ihrem PLZ-Bereich; und nur Events der passenden Audience.

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Helper: Stellen, die diesen User „sehen" dürften (PLZ-Match + Opt-In),
// gibt Office-IDs zurück.
//
// Achtung: req.user vom JWT enthält nur {id, email, role}. Wir laden die
// echten Stammdaten aus der DB nach.
async function visibleOfficeIds(jwtUser) {
  const u = await queryOne(
    `SELECT family_id, postal_code, role FROM users WHERE id = $1`,
    [jwtUser.id]
  );
  if (!u) return [];

  let pc = null;
  if (u.role === 'parent') {
    if (!u.family_id) return [];
    const fam = await queryOne(
      `SELECT visible_to_coordinators, postal_code FROM families WHERE id = $1`,
      [u.family_id]
    );
    if (!fam?.visible_to_coordinators) return [];
    pc = fam.postal_code || u.postal_code;
  } else if (u.role === 'grandparent') {
    const gp = await queryOne(
      `SELECT visible_to_coordinators FROM grandparent_profiles WHERE user_id = $1`,
      [jwtUser.id]
    );
    if (!gp?.visible_to_coordinators) return [];
    pc = u.postal_code;
  } else {
    return [];
  }
  if (!pc) return [];

  const prefix = pc.substring(0, 2);
  const offices = await queryAll(
    `SELECT id FROM coordination_offices WHERE $1 = ANY(postal_code_prefixes)`,
    [prefix]
  );
  return offices.map((o) => o.id);
}

// GET /api/events — Liste meiner zugänglichen Events
router.get('/', async (req, res) => {
  const offices = await visibleOfficeIds(req.user);
  if (!offices.length) return res.json({ events: [] });
  const audienceMatch = req.user.role === 'parent' ? ['parents', 'both'] : ['grandparents', 'both'];
  const officePlaceholders = offices.map((_, i) => `$${i + 1}`).join(',');
  const audiencePlaceholders = audienceMatch.map((_, i) => `$${offices.length + i + 1}`).join(',');
  const userIdParam = `$${offices.length + audienceMatch.length + 1}`;
  const events = await queryAll(
    `SELECT e.*,
            (SELECT status FROM coordinator_event_attendances WHERE event_id = e.id AND user_id = ${userIdParam}) AS my_status,
            (SELECT COUNT(*)::int FROM coordinator_event_attendances a WHERE a.event_id = e.id AND a.status = 'going') AS going_count,
            o.name AS office_name
       FROM coordinator_events e
       JOIN coordination_offices o ON o.id = e.office_id
       WHERE e.office_id IN (${officePlaceholders})
         AND e.audience IN (${audiencePlaceholders})
         AND e.end_at > NOW()
       ORDER BY e.start_at ASC LIMIT 100`,
    [...offices, ...audienceMatch, req.user.id]
  );
  res.json({ events });
});

// POST /api/events/:id/rsvp — Teilnahme zu/absagen
router.post('/:id/rsvp', async (req, res) => {
  const { status } = req.body;
  if (!['interested', 'going', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status.' });
  }
  // Prüfen ob das Event für mich sichtbar wäre (PLZ + Opt-In + Audience).
  const offices = await visibleOfficeIds(req.user);
  if (!offices.length) return res.status(403).json({ error: 'Kein Zugriff auf Events.' });
  const audienceMatch = req.user.role === 'parent' ? ['parents', 'both'] : ['grandparents', 'both'];
  const officePlaceholders = offices.map((_, i) => `$${i + 2}`).join(',');
  const audiencePlaceholders = audienceMatch.map((_, i) => `$${offices.length + 2 + i}`).join(',');
  const event = await queryOne(
    `SELECT id, capacity, start_at FROM coordinator_events
       WHERE id = $1 AND office_id IN (${officePlaceholders}) AND audience IN (${audiencePlaceholders})`,
    [req.params.id, ...offices, ...audienceMatch]
  );
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden.' });

  // Kapazität prüfen (nur bei 'going')
  if (status === 'going' && event.capacity) {
    const going = await queryOne(
      `SELECT COUNT(*)::int AS c FROM coordinator_event_attendances WHERE event_id = $1 AND status = 'going'`,
      [event.id]
    );
    const mine = await queryOne(
      `SELECT status FROM coordinator_event_attendances WHERE event_id = $1 AND user_id = $2`,
      [event.id, req.user.id]
    );
    const alreadyGoing = mine?.status === 'going';
    if (!alreadyGoing && going.c >= event.capacity) {
      return res.status(400).json({ error: 'Veranstaltung ist voll. Sie können sich aber als „interessiert" eintragen.' });
    }
  }

  const existing = await queryOne(
    `SELECT id FROM coordinator_event_attendances WHERE event_id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (existing) {
    await runSql(`UPDATE coordinator_event_attendances SET status = $1 WHERE id = $2`, [status, existing.id]);
  } else {
    await runSql(
      `INSERT INTO coordinator_event_attendances (id, event_id, user_id, status) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), req.params.id, req.user.id, status]
    );
  }
  res.json({ status });
});

module.exports = router;
