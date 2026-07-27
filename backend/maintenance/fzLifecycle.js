/**
 * Lifecycle-Job für Führungszeugnisse:
 *
 *  1. Setzt fz_status auf 'expired', sobald fz_expires_at überschritten ist.
 *  2. Verschickt Erinnerungs-Mails ~60 Tage und ~7 Tage vor Ablauf,
 *     genau einmal pro Stichtag (Flags fz_reminder_60d_sent_at /
 *     fz_reminder_7d_sent_at).
 *
 * Läuft alle 24h sowie einmal direkt beim Server-Start (mit ~30s Verzögerung,
 * damit DB-Migrationen sicher durch sind). Idempotent.
 */

const { pool } = require('../database');
const { sendFzExpiryReminder } = require('../utils/mail');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function runFzLifecycle() {
  const startedAt = new Date();
  console.log(`[fz-lifecycle] gestartet @ ${startedAt.toISOString()}`);

  // 1) Abgelaufene FZ markieren
  const expiredRes = await pool.query(
    `UPDATE grandparent_profiles
       SET fz_status = 'expired'
       WHERE fz_status = 'verified'
         AND fz_expires_at IS NOT NULL
         AND fz_expires_at < NOW()
       RETURNING user_id`
  );
  if (expiredRes.rowCount > 0) {
    console.log(`[fz-lifecycle] ${expiredRes.rowCount} FZ-Einträge auf 'expired' gesetzt`);
  }

  // 2a) 60-Tage-Reminder: alle, deren Ablauf in 30..60 Tagen liegt UND noch keinen 60d-Reminder hatten
  await dispatchReminders(60, 30, 'fz_reminder_60d_sent_at');

  // 2b) 7-Tage-Reminder: alle, deren Ablauf in 0..7 Tagen liegt UND noch keinen 7d-Reminder hatten
  await dispatchReminders(7, 0, 'fz_reminder_7d_sent_at');

  console.log(`[fz-lifecycle] fertig in ${Date.now() - startedAt.getTime()} ms`);
}

async function dispatchReminders(maxDays, minDays, flagColumn) {
  const candidates = await pool.query(
    `SELECT u.id, u.email, u.first_name, gp.fz_expires_at
       FROM grandparent_profiles gp
       JOIN users u ON u.id = gp.user_id
       WHERE gp.fz_status = 'verified'
         AND gp.fz_expires_at IS NOT NULL
         AND gp.fz_expires_at > NOW()
         AND gp.fz_expires_at <= NOW() + ($1 || ' days')::INTERVAL
         AND gp.fz_expires_at >  NOW() + ($2 || ' days')::INTERVAL
         AND gp.${flagColumn} IS NULL`,
    [maxDays, minDays]
  );

  for (const row of candidates.rows) {
    const days = Math.ceil((new Date(row.fz_expires_at).getTime() - Date.now()) / ONE_DAY_MS);
    try {
      await sendFzExpiryReminder(row.email, row.first_name, days, row.fz_expires_at);
      await pool.query(
        `UPDATE grandparent_profiles SET ${flagColumn} = NOW() WHERE user_id = $1`,
        [row.id]
      );
      console.log(`[fz-lifecycle] ${flagColumn} an ${row.email} (${days}d) verschickt`);
    } catch (err) {
      console.error(`[fz-lifecycle] Mail-Fehler an ${row.email}:`, err.message);
    }
  }
}

function startFzLifecycleScheduler() {
  // Erst-Start mit 30s Verzögerung
  setTimeout(() => {
    runFzLifecycle().catch((err) => console.error('[fz-lifecycle] Fehler:', err));
  }, 30 * 1000);

  // Danach alle 24h
  setInterval(() => {
    runFzLifecycle().catch((err) => console.error('[fz-lifecycle] Fehler:', err));
  }, ONE_DAY_MS);
}

module.exports = { runFzLifecycle, startFzLifecycleScheduler };
