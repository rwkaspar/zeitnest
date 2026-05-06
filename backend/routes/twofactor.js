const express = require('express');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { queryOne, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT email, totp_enabled FROM users WHERE id = $1', [req.user.id]);
    if (user.totp_enabled) return res.status(400).json({ error: '2FA ist bereits aktiviert.' });

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'Zeitnest', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    await runSql('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, req.user.id]);
    res.json({ secret, qr: qrDataUrl });
  } catch (err) {
    console.error('2FA setup error:', err.message);
    res.status(500).json({ error: '2FA-Einrichtung fehlgeschlagen.' });
  }
});

router.post('/enable', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Code erforderlich.' });

    const user = await queryOne('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id]);
    if (!user.totp_secret) return res.status(400).json({ error: 'Bitte erst Setup durchführen.' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA ist bereits aktiviert.' });

    if (!authenticator.check(token, user.totp_secret)) {
      return res.status(400).json({ error: 'Code ungültig.' });
    }

    await runSql('UPDATE users SET totp_enabled = TRUE WHERE id = $1', [req.user.id]);
    res.json({ message: '2FA aktiviert.' });
  } catch (err) {
    console.error('2FA enable error:', err.message);
    res.status(500).json({ error: '2FA-Aktivierung fehlgeschlagen.' });
  }
});

router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await queryOne('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id]);
    if (!user.totp_enabled) return res.status(400).json({ error: '2FA ist nicht aktiviert.' });

    if (!token || !authenticator.check(token, user.totp_secret)) {
      return res.status(400).json({ error: 'Code ungültig.' });
    }

    await runSql('UPDATE users SET totp_secret = NULL, totp_enabled = FALSE WHERE id = $1', [req.user.id]);
    res.json({ message: '2FA deaktiviert.' });
  } catch (err) {
    console.error('2FA disable error:', err.message);
    res.status(500).json({ error: 'Deaktivierung fehlgeschlagen.' });
  }
});

module.exports = router;
