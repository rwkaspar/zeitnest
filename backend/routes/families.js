const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const {
  ACTIVITIES, CONTACT_MODE, CONTACT_LOCATION, SUPPORT_OFFERED, DESIRED_GRANDPARENT,
  validateSubset, validateOne,
} = require('../constants/profileOptions');

const router = express.Router();

// Helper: lädt die Family des eingeloggten Users
async function loadOwnFamily(userId) {
  const user = await queryOne('SELECT family_id, role FROM users WHERE id = $1', [userId]);
  if (!user || user.role !== 'parent') return null;
  if (!user.family_id) return null;
  return queryOne('SELECT * FROM families WHERE id = $1', [user.family_id]);
}

// GET /api/families/me — eigene Family inkl. Mitglieder
router.get('/me', authenticateToken, async (req, res) => {
  const family = await loadOwnFamily(req.user.id);
  if (!family) return res.status(404).json({ error: 'Keine Family gefunden.' });
  const members = await queryAll(
    `SELECT id, email, first_name, last_name, avatar_url FROM users WHERE family_id = $1 ORDER BY created_at ASC`,
    [family.id]
  );
  res.json({ ...family, members });
});

// PUT /api/families/me — Family-Felder aktualisieren (alle Family-Member dürfen)
router.put('/me', authenticateToken, async (req, res) => {
  const family = await loadOwnFamily(req.user.id);
  if (!family) return res.status(404).json({ error: 'Keine Family gefunden.' });
  try {
    const {
      city, postal_code, phone,
      number_of_children, children_ages, needs_description, availability, preferred_activities,
      has_liability_insurance, children_in_liability, confidentiality_accepted,
      activities, desired_grandparent, allow_smoker_grandparent, allow_pet_grandparent,
      max_distance_km, contact_mode, contact_location, support_offered,
    } = req.body;

    await runSql(
      `UPDATE families SET
         city = $1, postal_code = $2, phone = $3,
         number_of_children = $4, children_ages = $5, needs_description = $6,
         availability = $7, preferred_activities = $8,
         has_liability_insurance = $9, children_in_liability = $10,
         confidentiality_accepted = COALESCE($11, confidentiality_accepted),
         activities = $12, desired_grandparent = $13,
         allow_smoker_grandparent = $14, allow_pet_grandparent = $15,
         max_distance_km = $16, contact_mode = $17,
         contact_location = $18, support_offered = $19,
         updated_at = NOW()
       WHERE id = $20`,
      [
        city, postal_code, phone,
        Number.isFinite(parseInt(number_of_children)) ? parseInt(number_of_children) : null,
        children_ages || null, needs_description || null, availability || null, preferred_activities || null,
        has_liability_insurance == null ? null : !!has_liability_insurance,
        children_in_liability == null ? null : !!children_in_liability,
        confidentiality_accepted == null ? null : !!confidentiality_accepted,
        validateSubset(activities, ACTIVITIES) || null,
        validateSubset(desired_grandparent, DESIRED_GRANDPARENT) || null,
        allow_smoker_grandparent == null ? null : !!allow_smoker_grandparent,
        allow_pet_grandparent == null ? null : !!allow_pet_grandparent,
        Number.isFinite(parseInt(max_distance_km)) ? parseInt(max_distance_km) : null,
        validateSubset(contact_mode, CONTACT_MODE) || null,
        validateSubset(contact_location, CONTACT_LOCATION) || null,
        validateSubset(support_offered, SUPPORT_OFFERED) || null,
        family.id,
      ]
    );
    res.json({ message: 'Family-Profil aktualisiert.' });
  } catch (err) {
    console.error('Family update error:', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Family.' });
  }
});

// POST /api/families/me/invite — Einladungs-Token erzeugen
router.post('/me/invite', authenticateToken, async (req, res) => {
  const family = await loadOwnFamily(req.user.id);
  if (!family) return res.status(404).json({ error: 'Keine Family gefunden.' });
  const id = uuidv4();
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 Tage
  await runSql(
    `INSERT INTO family_invites (id, family_id, invited_by_user_id, invited_email, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, family.id, req.user.id, req.body.email || null, token, expires]
  );
  res.json({
    token,
    expires_at: expires.toISOString(),
    invite_url: `/family/join/${token}`,
  });
});

// POST /api/families/join/:token — eingeloggter User tritt einer Family bei
router.post('/join/:token', authenticateToken, async (req, res) => {
  const invite = await queryOne(
    `SELECT * FROM family_invites WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
    [req.params.token]
  );
  if (!invite) return res.status(404).json({ error: 'Einladung ungültig oder abgelaufen.' });

  const user = await queryOne('SELECT id, role, family_id FROM users WHERE id = $1', [req.user.id]);
  if (user.role !== 'parent') return res.status(400).json({ error: 'Nur Eltern können einer Family beitreten.' });
  if (user.family_id === invite.family_id) {
    return res.json({ message: 'Sie sind bereits Mitglied dieser Family.', family_id: invite.family_id });
  }
  if (user.family_id) {
    // Existierende (vermutlich Solo-) Family wird verlassen und gelöscht falls leer
    const oldFamilyId = user.family_id;
    await runSql(`UPDATE users SET family_id = $1 WHERE id = $2`, [invite.family_id, req.user.id]);
    const stillThere = await queryOne(`SELECT COUNT(*)::int AS c FROM users WHERE family_id = $1`, [oldFamilyId]);
    if (stillThere.c === 0) {
      await runSql(`DELETE FROM families WHERE id = $1`, [oldFamilyId]);
    }
  } else {
    await runSql(`UPDATE users SET family_id = $1 WHERE id = $2`, [invite.family_id, req.user.id]);
  }
  await runSql(`UPDATE family_invites SET accepted_at = NOW() WHERE id = $1`, [invite.id]);
  res.json({ message: 'Beigetreten.', family_id: invite.family_id });
});

// DELETE /api/families/me/leave — Family verlassen (jedes Mitglied darf)
router.delete('/me/leave', authenticateToken, async (req, res) => {
  const family = await loadOwnFamily(req.user.id);
  if (!family) return res.status(404).json({ error: 'Keine Family gefunden.' });
  const others = await queryAll(`SELECT id FROM users WHERE family_id = $1 AND id != $2`, [family.id, req.user.id]);
  await runSql(`UPDATE users SET family_id = NULL WHERE id = $1`, [req.user.id]);
  if (others.length === 0) {
    await runSql(`DELETE FROM families WHERE id = $1`, [family.id]);
  }
  res.json({ message: 'Family verlassen.' });
});

// DELETE /api/families/me/members/:userId — Mitglied entfernen (jedes Mitglied darf)
router.delete('/me/members/:userId', authenticateToken, async (req, res) => {
  const family = await loadOwnFamily(req.user.id);
  if (!family) return res.status(404).json({ error: 'Keine Family gefunden.' });
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'Verwenden Sie /leave, um selbst auszutreten.' });
  }
  const target = await queryOne(`SELECT family_id FROM users WHERE id = $1`, [req.params.userId]);
  if (!target || target.family_id !== family.id) {
    return res.status(404).json({ error: 'Mitglied nicht in dieser Family.' });
  }
  await runSql(`UPDATE users SET family_id = NULL WHERE id = $1`, [req.params.userId]);
  res.json({ message: 'Mitglied entfernt.' });
});

module.exports = router;
