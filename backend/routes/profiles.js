const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const {
  ACTIVITIES, MOBILITY, DESIRED_GRANDPARENT, CONTACT_MODE, CONTACT_LOCATION,
  SUPPORT_OFFERED, MARITAL_STATUS, validateSubset, validateOne,
} = require('../constants/profileOptions');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const FZ_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'fz');
fs.mkdirSync(FZ_UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = crypto.randomBytes(16).toString('hex') + ext;
      cb(null, safe);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Nur JPG, PNG oder WebP erlaubt.'));
  },
});

const fzUpload = multer({
  storage: multer.diskStorage({
    destination: FZ_UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = crypto.randomBytes(16).toString('hex') + ext;
      cb(null, safe);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Nur PDF, JPG oder PNG erlaubt.'));
  },
});

router.post('/avatar', authenticateToken, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Keine Datei.' });

    try {
      // Delete old avatar if exists
      const oldUser = await queryOne('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
      if (oldUser?.avatar_url) {
        const oldPath = path.join(__dirname, '..', oldUser.avatar_url.replace(/^\//, ''));
        fs.unlink(oldPath, () => {});
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await runSql('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, req.user.id]);
      res.json({ avatar_url: avatarUrl });
    } catch (e) {
      console.error('Avatar upload error:', e.message);
      res.status(500).json({ error: 'Upload fehlgeschlagen.' });
    }
  });
});

// Führungszeugnis: aktuellen Status für den eingeloggten User abrufen
router.get('/me/fz', authenticateToken, async (req, res) => {
  if (req.user.role !== 'grandparent') {
    return res.status(403).json({ error: 'Nur für Leih-Großeltern.' });
  }
  const row = await queryOne(
    'SELECT fz_status, fz_submitted_at, fz_verified_at, fz_expires_at, fz_admin_note FROM grandparent_profiles WHERE user_id = $1',
    [req.user.id]
  );
  res.json(row || { fz_status: 'not_submitted' });
});

// Führungszeugnis hochladen
router.post('/me/fz', authenticateToken, (req, res) => {
  if (req.user.role !== 'grandparent') {
    return res.status(403).json({ error: 'Nur für Leih-Großeltern.' });
  }
  fzUpload.single('fz')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Keine Datei.' });

    try {
      // Bestehende Datei löschen, falls vorher schon eine hochgeladen war
      const existing = await queryOne('SELECT fz_filename FROM grandparent_profiles WHERE user_id = $1', [req.user.id]);
      if (existing?.fz_filename) {
        fs.unlink(path.join(FZ_UPLOAD_DIR, existing.fz_filename), () => {});
      }

      await runSql(
        `UPDATE grandparent_profiles
         SET fz_status = 'pending', fz_submitted_at = NOW(), fz_filename = $1, fz_admin_note = NULL
         WHERE user_id = $2`,
        [req.file.filename, req.user.id]
      );
      res.json({ fz_status: 'pending', fz_submitted_at: new Date().toISOString() });
    } catch (e) {
      console.error('FZ upload error:', e.message);
      // Datei vom Disk löschen wenn DB-Update fehlschlägt
      fs.unlink(path.join(FZ_UPLOAD_DIR, req.file.filename), () => {});
      res.status(500).json({ error: 'Upload fehlgeschlagen.' });
    }
  });
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, role, first_name, last_name, city, postal_code, bio, avatar_url, is_demo, created_at, birth_date, profession, working_hours, marital_status, smoker, pets, mobility, hobbies FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Profil nicht gefunden.' });

    let profile = null;
    let family = null;
    let fz_verified = false;
    if (user.role === 'parent') {
      profile = await queryOne('SELECT * FROM parent_profiles WHERE user_id = $1', [user.id]);
      const userWithFamily = await queryOne('SELECT family_id FROM users WHERE id = $1', [user.id]);
      if (userWithFamily?.family_id) {
        family = await queryOne('SELECT * FROM families WHERE id = $1', [userWithFamily.family_id]);
        if (family) {
          family.members = await queryAll(
            `SELECT id, first_name, last_name, avatar_url FROM users WHERE family_id = $1 ORDER BY created_at ASC`,
            [family.id]
          );
        }
      }
    } else {
      profile = await queryOne('SELECT * FROM grandparent_profiles WHERE user_id = $1', [user.id]);
      // fz_verified: nur true wenn aktuell verifiziert UND nicht abgelaufen
      // Keine Daten (Datum/Dokument) im öffentlichen Profil leaken
      fz_verified = !!(profile?.fz_status === 'verified' &&
        (!profile.fz_expires_at || new Date(profile.fz_expires_at) > new Date()));
      if (profile) {
        delete profile.fz_filename;
        delete profile.fz_admin_note;
        delete profile.fz_submitted_at;
        delete profile.fz_verified_at;
        delete profile.fz_expires_at;
        delete profile.fz_status;
      }
    }

    const reviews = await queryAll(`SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewed_id = $1 ORDER BY r.created_at DESC`, [req.params.id]);
    const rating = await queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewed_id = $1', [req.params.id]);

    res.json({ ...user, profile, family, fz_verified, reviews, rating });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Fehler beim Laden des Profils.' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const {
      first_name, last_name, city, postal_code, phone, bio,
      birth_date, profession, working_hours, marital_status,
      smoker, pets, mobility, hobbies,
    } = req.body;

    await runSql(
      `UPDATE users SET
         first_name = $1, last_name = $2, city = $3, postal_code = $4, phone = $5, bio = $6,
         birth_date = $7, profession = $8, working_hours = $9, marital_status = $10,
         smoker = $11, pets = $12, mobility = $13, hobbies = $14,
         updated_at = NOW()
       WHERE id = $15`,
      [
        first_name, last_name, city, postal_code, phone, bio,
        birth_date || null, profession || null,
        Number.isFinite(parseInt(working_hours)) ? parseInt(working_hours) : null,
        validateOne(marital_status, MARITAL_STATUS),
        smoker == null ? null : !!smoker,
        pets || null,
        validateSubset(mobility, MOBILITY) || null,
        hobbies || null,
        req.user.id,
      ]
    );

    if (req.user.role === 'parent') {
      // Family-spezifische Felder werden über PUT /api/families/me geschrieben,
      // nicht mehr hier. parent_profiles ist seit Stage A.5 ein leerer Stub.
    } else {
      const {
        experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis,
        activities, has_liability_insurance,
      } = req.body;

      await runSql(
        `UPDATE grandparent_profiles SET
           experience = $1, availability = $2, preferred_age_range = $3,
           offered_activities = $4, has_fuehrungszeugnis = $5,
           activities = $6, has_liability_insurance = $7
         WHERE user_id = $8`,
        [
          experience, availability, preferred_age_range, offered_activities,
          has_fuehrungszeugnis ? true : false,
          validateSubset(activities, ACTIVITIES) || null,
          has_liability_insurance == null ? null : !!has_liability_insurance,
          req.user.id,
        ]
      );
    }

    res.json({ message: 'Profil erfolgreich aktualisiert.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils.' });
  }
});

module.exports = router;
