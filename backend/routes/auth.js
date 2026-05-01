const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mail');

const router = express.Router();

function sanitize(str, maxLen = 200) {
  if (!str) return str;
  return String(str).trim().substring(0, maxLen);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validatePassword(password) {
  if (password.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein.';
  if (!/[A-Z]/.test(password)) return 'Passwort muss mindestens einen Großbuchstaben enthalten.';
  if (!/[a-z]/.test(password)) return 'Passwort muss mindestens einen Kleinbuchstaben enthalten.';
  if (!/[0-9]/.test(password)) return 'Passwort muss mindestens eine Zahl enthalten.';
  return null;
}

// === REGISTER ===
router.post('/register', async (req, res) => {
  try {
    const email = sanitize(req.body.email, 254);
    const password = req.body.password;
    const role = sanitize(req.body.role, 20);
    const first_name = sanitize(req.body.first_name, 100);
    const last_name = sanitize(req.body.last_name, 100);
    const city = sanitize(req.body.city, 100);
    const postal_code = sanitize(req.body.postal_code, 10);

    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ error: 'Bitte alle Pflichtfelder ausfüllen.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    if (!['parent', 'grandparent'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle.' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await runSql(
      `INSERT INTO users (id, email, password, role, first_name, last_name, city, postal_code, email_verified, verification_token, verification_token_expires)
       VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, FALSE, $9, $10)`,
      [id, email, hashedPassword, role, first_name, last_name, city || null, postal_code || null, verificationToken, tokenExpires]
    );

    if (role === 'parent') {
      await runSql('INSERT INTO parent_profiles (user_id) VALUES ($1)', [id]);
    } else {
      await runSql('INSERT INTO grandparent_profiles (user_id) VALUES ($1)', [id]);
    }

    // Send verification email (non-blocking)
    sendVerificationEmail(email.toLowerCase(), verificationToken, first_name).catch(err => {
      console.error('Verification email failed:', err.message);
    });

    const token = jwt.sign({ id, email: email.toLowerCase(), role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({
      token,
      user: { id, email: email.toLowerCase(), role, first_name, last_name, city, postal_code, email_verified: false },
      message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihr E-Mail-Postfach und bestätigen Sie Ihre Adresse.'
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' });
  }
});

// === VERIFY EMAIL ===
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, email FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
      [req.params.token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Bestätigungslink.' });
    }

    await runSql(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ message: 'E-Mail-Adresse erfolgreich bestätigt! Sie können sich jetzt anmelden.' });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Verifizierung fehlgeschlagen.' });
  }
});

// === RESEND VERIFICATION ===
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, first_name, email_verified FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    if (user.email_verified) return res.json({ message: 'E-Mail-Adresse ist bereits bestätigt.' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await runSql(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, tokenExpires, user.id]
    );

    await sendVerificationEmail(user.email, verificationToken, user.first_name);
    res.json({ message: 'Bestätigungsmail wurde erneut gesendet.' });
  } catch (err) {
    console.error('Resend verification error:', err.message);
    res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
  }
});

// === LOGIN ===
router.post('/login', async (req, res) => {
  try {
    const email = sanitize(req.body.email, 254);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Bitte E-Mail und Passwort eingeben.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Überprüfen Sie Ihr Postfach.',
        unverified: true
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name, city: user.city, postal_code: user.postal_code, bio: user.bio, avatar_url: user.avatar_url, email_verified: user.email_verified }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Anmeldung fehlgeschlagen.' });
  }
});

// === FORGOT PASSWORD ===
router.post('/forgot-password', async (req, res) => {
  try {
    const email = sanitize(req.body.email, 254);
    if (!email) return res.status(400).json({ error: 'Bitte E-Mail-Adresse eingeben.' });

    // Always return success (prevent email enumeration)
    const user = await queryOne('SELECT id, email, first_name FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await runSql(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [resetToken, tokenExpires, user.id]
      );

      sendPasswordResetEmail(user.email, resetToken, user.first_name).catch(err => {
        console.error('Reset email failed:', err.message);
      });
    }

    res.json({ message: 'Wenn ein Konto mit dieser E-Mail existiert, wurde eine Nachricht zum Zurücksetzen gesendet.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Anfrage fehlgeschlagen.' });
  }
});

// === RESET PASSWORD ===
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token und Passwort sind erforderlich.' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await queryOne(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Reset-Link.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await runSql(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Passwort erfolgreich geändert. Sie können sich jetzt anmelden.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Passwort konnte nicht geändert werden.' });
  }
});

// === ME ===
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, role, first_name, last_name, city, postal_code, phone, bio, avatar_url, email_verified, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });

    let profile = null;
    if (user.role === 'parent') {
      profile = await queryOne('SELECT * FROM parent_profiles WHERE user_id = $1', [user.id]);
    } else {
      profile = await queryOne('SELECT * FROM grandparent_profiles WHERE user_id = $1', [user.id]);
    }
    res.json({ ...user, profile });
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ error: 'Fehler beim Laden des Profils.' });
  }
});

// === DSGVO: Account löschen ===
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    await runSql('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Ihr Konto und alle zugehörigen Daten wurden unwiderruflich gelöscht.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Konto konnte nicht gelöscht werden.' });
  }
});

// === DSGVO: Datenexport ===
router.get('/me/export', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, role, first_name, last_name, city, postal_code, phone, bio, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });

    let profile = null;
    if (user.role === 'parent') {
      profile = await queryOne('SELECT * FROM parent_profiles WHERE user_id = $1', [user.id]);
    } else {
      profile = await queryOne('SELECT * FROM grandparent_profiles WHERE user_id = $1', [user.id]);
    }

    const messages = await queryAll('SELECT content, created_at FROM messages WHERE sender_id = $1 ORDER BY created_at', [user.id]);
    const bookings = await queryAll('SELECT booking_date, start_time, end_time, status, note, created_at FROM bookings WHERE parent_id = $1 OR grandparent_id = $1 ORDER BY created_at', [user.id]);
    const reviews = await queryAll('SELECT rating, comment, created_at FROM reviews WHERE reviewer_id = $1 ORDER BY created_at', [user.id]);

    const exportData = {
      exportiert_am: new Date().toISOString(),
      benutzer: user,
      profil: profile,
      nachrichten: messages,
      buchungen: bookings,
      bewertungen: reviews,
    };

    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="zeitnest-datenexport.json"'
    });
    res.json(exportData);
  } catch (err) {
    console.error('Data export error:', err.message);
    res.status(500).json({ error: 'Datenexport fehlgeschlagen.' });
  }
});

module.exports = router;
