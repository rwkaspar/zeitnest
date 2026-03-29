const express = require('express');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = queryOne('SELECT id, email, role, first_name, last_name, city, postal_code, bio, avatar_url, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Profil nicht gefunden.' });

    let profile = null;
    if (user.role === 'parent') {
      profile = queryOne('SELECT * FROM parent_profiles WHERE user_id = ?', [user.id]);
    } else {
      profile = queryOne('SELECT * FROM grandparent_profiles WHERE user_id = ?', [user.id]);
    }

    const reviews = queryAll(`SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewed_id = ? ORDER BY r.created_at DESC`, [req.params.id]);
    const rating = queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewed_id = ?', [req.params.id]);

    res.json({ ...user, profile, reviews, rating });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Fehler beim Laden des Profils.' });
  }
});

router.put('/me', authenticateToken, (req, res) => {
  try {
    const { first_name, last_name, city, postal_code, phone, bio } = req.body;
    runSql(`UPDATE users SET first_name = ?, last_name = ?, city = ?, postal_code = ?, phone = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [first_name, last_name, city, postal_code, phone, bio, req.user.id]);

    if (req.user.role === 'parent') {
      const { number_of_children, children_ages, needs_description, availability, preferred_activities } = req.body;
      runSql(`UPDATE parent_profiles SET number_of_children = ?, children_ages = ?, needs_description = ?, availability = ?, preferred_activities = ? WHERE user_id = ?`, [number_of_children, children_ages, needs_description, availability, preferred_activities, req.user.id]);
    } else {
      const { experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis, mobility } = req.body;
      runSql(`UPDATE grandparent_profiles SET experience = ?, availability = ?, preferred_age_range = ?, offered_activities = ?, has_fuehrungszeugnis = ?, mobility = ? WHERE user_id = ?`, [experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis ? 1 : 0, mobility, req.user.id]);
    }

    res.json({ message: 'Profil erfolgreich aktualisiert.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils.' });
  }
});

module.exports = router;
