const express = require('express');
const { queryOne, queryAll } = require('../database');
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

// Eigene Koordinierungsstelle inkl. PLZ-Bereich
router.get('/me', async (req, res) => {
  if (!req.coordinatorOfficeId) {
    return res.json({ office: null });
  }
  const office = await queryOne('SELECT * FROM coordination_offices WHERE id = $1', [req.coordinatorOfficeId]);
  res.json({ office });
});

// Helper: wandelt PLZ-Präfix-Array in PostgreSQL ANY(LIKE) Suche um
function buildPostalCodeFilter(prefixes, columnAlias) {
  if (!prefixes || prefixes.length === 0) return { clause: '', params: [] };
  // generiert: AND ( col LIKE 'XX%' OR col LIKE 'YY%' ...)
  const parts = prefixes.map(() => `${columnAlias} LIKE $$INDEX$$`);
  return { clause: parts.join(' OR '), params: prefixes.map((p) => `${p}%`) };
}

// Familien im Zuständigkeits-Bereich
router.get('/families', async (req, res) => {
  if (!req.coordinatorOfficeId) return res.json({ families: [] });
  const office = await queryOne('SELECT postal_code_prefixes FROM coordination_offices WHERE id = $1', [req.coordinatorOfficeId]);
  const prefixes = office?.postal_code_prefixes || [];
  if (prefixes.length === 0) return res.json({ families: [] });

  const placeholders = prefixes.map((_, i) => `$${i + 1}`).join(', ');
  const families = await queryAll(
    `SELECT
       f.id, f.city, f.postal_code, f.number_of_children, f.children_ages,
       f.desired_grandparent, f.max_distance_km, f.created_at,
       (SELECT json_agg(json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name))
         FROM users u WHERE u.family_id = f.id) AS members
     FROM families f
     WHERE f.postal_code IS NOT NULL
       AND substring(f.postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])
     ORDER BY f.created_at DESC
     LIMIT 200`,
    prefixes
  );
  res.json({ families });
});

// Wunschgroßeltern im Zuständigkeits-Bereich
router.get('/grandparents', async (req, res) => {
  if (!req.coordinatorOfficeId) return res.json({ grandparents: [] });
  const office = await queryOne('SELECT postal_code_prefixes FROM coordination_offices WHERE id = $1', [req.coordinatorOfficeId]);
  const prefixes = office?.postal_code_prefixes || [];
  if (prefixes.length === 0) return res.json({ grandparents: [] });

  const placeholders = prefixes.map((_, i) => `$${i + 1}`).join(', ');
  const grandparents = await queryAll(
    `SELECT
       u.id, u.first_name, u.last_name, u.city, u.postal_code, u.bio, u.avatar_url,
       u.created_at, u.birth_date, u.mobility,
       gp.experience, gp.availability, gp.preferred_age_range, gp.activities,
       (gp.fz_status = 'verified' AND (gp.fz_expires_at IS NULL OR gp.fz_expires_at > NOW())) AS fz_verified
     FROM users u
     LEFT JOIN grandparent_profiles gp ON u.id = gp.user_id
     WHERE u.role = 'grandparent'
       AND u.postal_code IS NOT NULL
       AND substring(u.postal_code from 1 for 2) = ANY(ARRAY[${placeholders}])
     ORDER BY u.created_at DESC
     LIMIT 200`,
    prefixes
  );
  res.json({ grandparents });
});

module.exports = router;
