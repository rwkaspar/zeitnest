const express = require('express');
const { queryAll, queryOne } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { HELPER_CATEGORIES, SKILLS, validateSubset, validateOne } = require('../constants/profileOptions');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { city, postal_code, near_postal_code, radius_km, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const searchRole = req.user.role === 'parent' ? 'grandparent' : 'parent';

    // Phase 2: optionale Helfer-Filter. Ungültige/fehlende Werte → kein Filter,
    // exakt heutiges Verhalten. Nur relevant, wenn nach Helfenden gesucht wird.
    const helperCategory = searchRole === 'grandparent'
      ? validateOne(req.query.helper_category, HELPER_CATEGORIES) : null;
    const skillsRaw = typeof req.query.skills === 'string' ? req.query.skills.split(',') : req.query.skills;
    const helperSkills = searchRole === 'grandparent'
      ? validateSubset(skillsRaw, SKILLS) : null;

    let query, params;
    let paramIdx = 1;

    if (searchRole === 'grandparent') {
      query = `SELECT u.id, u.first_name, u.last_name, u.city, u.postal_code, u.bio, u.avatar_url, u.is_demo, u.created_at, gp.experience, gp.availability, gp.preferred_age_range, gp.offered_activities, gp.has_fuehrungszeugnis, gp.mobility, gp.helper_category, gp.skills, (gp.fz_status = 'verified' AND (gp.fz_expires_at IS NULL OR gp.fz_expires_at > NOW())) AS fz_verified FROM users u LEFT JOIN grandparent_profiles gp ON u.id = gp.user_id WHERE u.role = $1 AND u.id != $2`;
    } else {
      query = `SELECT u.id, u.first_name, u.last_name, u.city, u.postal_code, u.bio, u.avatar_url, u.is_demo, u.created_at, f.number_of_children, f.children_ages, f.needs_description, f.availability, f.preferred_activities FROM users u LEFT JOIN families f ON u.family_id = f.id WHERE u.role = $1 AND u.id != $2`;
    }

    params = [searchRole, req.user.id];
    paramIdx = 3;

    if (city) {
      query += ` AND LOWER(u.city) LIKE LOWER($${paramIdx})`;
      params.push(`%${city}%`);
      paramIdx++;
    }
    if (postal_code) {
      query += ` AND u.postal_code LIKE $${paramIdx}`;
      params.push(`${postal_code}%`);
      paramIdx++;
    }
    // Umkreis: Mapping von km auf PLZ-Präfix-Länge
    //   1 km   → 4-stelliger Präfix (faktisch selber Ort)
    //   10 km  → 3-stelliger Präfix
    //   50 km  → 2-stelliger Präfix
    //   150 km → 1-stelliger Präfix
    if (near_postal_code && near_postal_code.length >= 1) {
      const km = parseInt(radius_km);
      const prefixLen = km <= 1 ? 4 : km <= 10 ? 3 : km <= 50 ? 2 : 1;
      const prefix = near_postal_code.substring(0, Math.min(prefixLen, near_postal_code.length));
      query += ` AND u.postal_code LIKE $${paramIdx}`;
      params.push(`${prefix}%`);
      paramIdx++;
    }
    if (helperCategory) {
      query += ` AND gp.helper_category = $${paramIdx}`;
      params.push(helperCategory);
      paramIdx++;
    }
    if (helperSkills && helperSkills.length) {
      query += ` AND gp.skills && $${paramIdx}::text[]`;
      params.push(helperSkills);
      paramIdx++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const results = await queryAll(query, params);

    const enriched = await Promise.all(results.map(async (u) => {
      const rating = await queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE reviewed_id = $1', [u.id]);
      return { ...u, avg_rating: rating?.avg_rating, review_count: parseInt(rating?.review_count) || 0 };
    }));

    // Count total
    let countParams = [searchRole, req.user.id];
    const needsGpJoin = helperCategory || (helperSkills && helperSkills.length);
    let countQuery = `SELECT COUNT(*) as total FROM users u${needsGpJoin ? ' LEFT JOIN grandparent_profiles gp ON u.id = gp.user_id' : ''} WHERE u.role = $1 AND u.id != $2`;
    let cIdx = 3;
    if (city) { countQuery += ` AND LOWER(u.city) LIKE LOWER($${cIdx})`; countParams.push(`%${city}%`); cIdx++; }
    if (postal_code) { countQuery += ` AND u.postal_code LIKE $${cIdx}`; countParams.push(`${postal_code}%`); cIdx++; }
    if (near_postal_code && near_postal_code.length >= 1) {
      const km = parseInt(radius_km);
      const prefixLen = km <= 1 ? 4 : km <= 10 ? 3 : km <= 50 ? 2 : 1;
      const prefix = near_postal_code.substring(0, Math.min(prefixLen, near_postal_code.length));
      countQuery += ` AND u.postal_code LIKE $${cIdx}`;
      countParams.push(`${prefix}%`);
      cIdx++;
    }
    if (helperCategory) { countQuery += ` AND gp.helper_category = $${cIdx}`; countParams.push(helperCategory); cIdx++; }
    if (helperSkills && helperSkills.length) { countQuery += ` AND gp.skills && $${cIdx}::text[]`; countParams.push(helperSkills); cIdx++; }
    const totalRow = await queryOne(countQuery, countParams);
    const total = parseInt(totalRow?.total) || 0;

    res.json({ results: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Suche fehlgeschlagen.' });
  }
});

module.exports = router;
