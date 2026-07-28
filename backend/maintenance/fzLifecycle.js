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
const { sendFzExpiryReminder, sendFzUploadReminder } = require('../utils/mail');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_WEEKS = parseInt(process.env.FZ_GRACE_WEEKS) || 8;

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

  // 3) Karenzzeit für fehlendes FZ: Upload-Erinnerungen nach 2 und 4 Wochen,
  //    Auto-Pause (aus Suche/Matching) nach GRACE_WEEKS. Demo-Accounts sind
  //    ausgenommen (bleiben sichtbar, bekommen keine Mails an @zeitnest.local).
  await dispatchGraceReminders(14, 'fz_grace_reminder_2w_sent_at', false);
  await dispatchGraceReminders(28, 'fz_grace_reminder_4w_sent_at', false);
  await pauseOverdueProfiles();

  console.log(`[fz-lifecycle] fertig in ${Date.now() - startedAt.getTime()} ms`);
}

// Basis der Karenz: Registrierung; nach abgelehntem Upload zählt der Upload-Zeitpunkt,
// nach Ablauf eines FZ dessen Ablaufdatum.
const GRACE_BASE_SQL = `GREATEST(u.created_at, COALESCE(gp.fz_submitted_at, u.created_at), COALESCE(gp.fz_expires_at, u.created_at))`;
const GRACE_CANDIDATE_SQL = `
  FROM grandparent_profiles gp
  JOIN users u ON u.id = gp.user_id
  WHERE gp.fz_status IN ('not_submitted', 'rejected', 'expired')
    AND u.is_demo = FALSE
    AND u.email_verified = TRUE`;

async function dispatchGraceReminders(minDays, flagColumn, paused) {
  const candidates = await pool.query(
    `SELECT u.id, u.email, u.first_name ${GRACE_CANDIDATE_SQL}
       AND gp.fz_grace_paused_at IS NULL
       AND ${GRACE_BASE_SQL} < NOW() - ($1 || ' days')::INTERVAL
       AND gp.${flagColumn} IS NULL`,
    [minDays]
  );
  for (const row of candidates.rows) {
    try {
      await sendFzUploadReminder(row.email, row.first_name, GRACE_WEEKS, paused);
      await pool.query(`UPDATE grandparent_profiles SET ${flagColumn} = NOW() WHERE user_id = $1`, [row.id]);
      console.log(`[fz-lifecycle] ${flagColumn} an ${row.email} verschickt`);
    } catch (err) {
      console.error(`[fz-lifecycle] Grace-Mail-Fehler an ${row.email}:`, err.message);
    }
  }
}

async function pauseOverdueProfiles() {
  const overdue = await pool.query(
    `SELECT u.id, u.email, u.first_name ${GRACE_CANDIDATE_SQL}
       AND gp.fz_grace_paused_at IS NULL
       AND ${GRACE_BASE_SQL} < NOW() - ($1 || ' weeks')::INTERVAL`,
    [GRACE_WEEKS]
  );
  for (const row of overdue.rows) {
    await pool.query(`UPDATE grandparent_profiles SET fz_grace_paused_at = NOW() WHERE user_id = $1`, [row.id]);
    console.log(`[fz-lifecycle] Profil pausiert (FZ fehlt > ${GRACE_WEEKS} Wochen): ${row.email}`);
    try {
      await sendFzUploadReminder(row.email, row.first_name, GRACE_WEEKS, true);
    } catch (err) {
      console.error(`[fz-lifecycle] Pause-Mail-Fehler an ${row.email}:`, err.message);
    }
  }
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
