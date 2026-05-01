const express = require('express');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, role, first_name, last_name, city, postal_code, bio, avatar_url, is_demo, created_at FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Profil nicht gefunden.' });

    let profile = null;
    if (user.role === 'parent') {
      profile = await queryOne('SELECT * FROM parent_profiles WHERE user_id = $1', [user.id]);
    } else {
      profile = await queryOne('SELECT * FROM grandparent_profiles WHERE user_id = $1', [user.id]);
    }

    const reviews = await queryAll(`SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewed_id = $1 ORDER BY r.created_at DESC`, [req.params.id]);
    const rating = await queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewed_id = $1', [req.params.id]);

    res.json({ ...user, profile, reviews, rating });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Fehler beim Laden des Profils.' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, city, postal_code, phone, bio } = req.body;
    await runSql(`UPDATE users SET first_name = $1, last_name = $2, city = $3, postal_code = $4, phone = $5, bio = $6, updated_at = NOW() WHERE id = $7`, [first_name, last_name, city, postal_code, phone, bio, req.user.id]);

    if (req.user.role === 'parent') {
      const { number_of_children, children_ages, needs_description, availability, preferred_activities } = req.body;
      await runSql(`UPDATE parent_profiles SET number_of_children = $1, children_ages = $2, needs_description = $3, availability = $4, preferred_activities = $5 WHERE user_id = $6`, [number_of_children, children_ages, needs_description, availability, preferred_activities, req.user.id]);
    } else {
      const { experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis, mobility } = req.body;
      await runSql(`UPDATE grandparent_profiles SET experience = $1, availability = $2, preferred_age_range = $3, offered_activities = $4, has_fuehrungszeugnis = $5, mobility = $6 WHERE user_id = $7`, [experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis ? true : false, mobility, req.user.id]);
    }

    res.json({ message: 'Profil erfolgreich aktualisiert.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils.' });
  }
});

module.exports = router;
