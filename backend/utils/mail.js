const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.neotactiq.ai',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const fromAddress = process.env.SMTP_FROM || 'noreply@zeitnest.org';
const FROM = `"Zeitnest" <${fromAddress}>`;
const BASE_URL = process.env.BASE_URL || 'https://zeitnest.org';

function htmlTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafbfc;font-family:Arial,sans-serif;color:#2c3e50;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafbfc;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;padding:32px;max-width:600px;">
<tr><td align="center" style="padding-bottom:24px;">
<a href="${BASE_URL}" style="text-decoration:none;"><img src="${BASE_URL}/email-logo.png" alt="Zeitnest" width="220" style="display:block;width:220px;max-width:220px;height:auto;border:0;outline:none;text-decoration:none;"></a>
</td></tr>
${bodyHtml}
<tr><td style="padding-top:24px;border-top:1px solid #e1e8ee;color:#5a6878;font-size:12px;">
Zeitnest &ndash; Zeit schenken. Zeit gewinnen.<br>
<a href="${BASE_URL}" style="color:#e8725a;">${BASE_URL}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendVerificationEmail(email, token, firstName) {
  const link = `${BASE_URL}/verify/${token}`;
  const subject = 'Zeitnest – Bitte bestätigen Sie Ihre E-Mail-Adresse';

  const text = `Willkommen bei Zeitnest!

Hallo ${firstName},

vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie folgenden Link öffnen:

${link}

Dieser Link ist 24 Stunden gültig.

Wenn Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie einfach.

Viele Grüße
Ihr Zeitnest-Team`;

  const body = `
<tr><td>
<h1 style="color:#e8725a;font-size:24px;margin:0 0 16px;">Willkommen bei Zeitnest!</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">Hallo ${firstName},</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:</p>
<p style="margin:24px 0;text-align:center;">
<a href="${link}" style="background-color:#e8725a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">E-Mail bestätigen</a>
</p>
<p style="font-size:14px;line-height:1.5;margin:0 0 8px;color:#5a6878;">Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p style="font-size:14px;line-height:1.5;margin:0 0 16px;word-break:break-all;"><a href="${link}" style="color:#e8725a;">${link}</a></p>
<p style="font-size:14px;line-height:1.5;margin:0;color:#5a6878;">Dieser Link ist 24 Stunden gültig.</p>
</td></tr>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject,
    text,
    html: htmlTemplate(subject, body),
  });
}

async function sendPasswordResetEmail(email, token, firstName) {
  const link = `${BASE_URL}/passwort-reset/${token}`;
  const subject = 'Zeitnest – Passwort zurücksetzen';

  const text = `Passwort zurücksetzen

Hallo ${firstName},

Sie haben angefordert, Ihr Passwort zurückzusetzen. Öffnen Sie den folgenden Link:

${link}

Dieser Link ist 1 Stunde gültig.

Wenn Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail.

Viele Grüße
Ihr Zeitnest-Team`;

  const body = `
<tr><td>
<h1 style="color:#e8725a;font-size:24px;margin:0 0 16px;">Passwort zurücksetzen</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">Hallo ${firstName},</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link:</p>
<p style="margin:24px 0;text-align:center;">
<a href="${link}" style="background-color:#e8725a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Neues Passwort setzen</a>
</p>
<p style="font-size:14px;line-height:1.5;margin:0 0 8px;color:#5a6878;">Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p style="font-size:14px;line-height:1.5;margin:0 0 16px;word-break:break-all;"><a href="${link}" style="color:#e8725a;">${link}</a></p>
<p style="font-size:14px;line-height:1.5;margin:0;color:#5a6878;">Dieser Link ist 1 Stunde gültig. Wenn Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail.</p>
</td></tr>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject,
    text,
    html: htmlTemplate(subject, body),
  });
}

async function sendNotification(email, firstName, subject, intro, ctaText, ctaPath, footer = '') {
  const link = `${BASE_URL}${ctaPath}`;
  const text = `${intro.replace(/<[^>]+>/g, '')}\n\n${link}\n\n${footer}\n\n— Zeitnest`;
  const body = `
<tr><td>
<h1 style="color:#e8725a;font-size:22px;margin:0 0 16px;">${subject}</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">Hallo ${firstName},</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">${intro}</p>
<p style="margin:24px 0;text-align:center;">
<a href="${link}" style="background-color:#e8725a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">${ctaText}</a>
</p>
<p style="font-size:14px;line-height:1.5;margin:0;color:#5a6878;">${footer}</p>
</td></tr>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Zeitnest – ${subject}`,
    text,
    html: htmlTemplate(subject, body),
  });
}

async function sendMatchRequestEmail(email, firstName, fromName) {
  return sendNotification(
    email, firstName,
    'Neue Anfrage',
    `<strong>${fromName}</strong> möchte Sie kennenlernen und hat Ihnen eine Anfrage über Zeitnest geschickt.`,
    'Anfrage ansehen', '/anfragen',
    'Sie können in Ihrer Anfragen-Liste annehmen oder ablehnen.'
  );
}

async function sendBookingCreatedEmail(email, firstName, fromName, dateStr, timeStr) {
  return sendNotification(
    email, firstName,
    'Neuer Termin gebucht',
    `<strong>${fromName}</strong> hat einen Termin am <strong>${dateStr}</strong> um <strong>${timeStr}</strong> gebucht.`,
    'Termin im Kalender', '/kalender',
    'Sie können den Termin im Kalender einsehen oder ihn als .ics-Datei für Google/Apple Calendar exportieren.'
  );
}

async function sendBookingCancelledEmail(email, firstName, fromName, dateStr) {
  return sendNotification(
    email, firstName,
    'Termin storniert',
    `<strong>${fromName}</strong> hat den Termin am <strong>${dateStr}</strong> storniert.`,
    'Kalender öffnen', '/kalender',
    ''
  );
}

async function sendNewMessageEmail(email, firstName, fromName, matchId) {
  return sendNotification(
    email, firstName,
    'Neue Nachricht',
    `<strong>${fromName}</strong> hat Ihnen eine neue Nachricht geschickt.`,
    'Nachricht lesen', `/nachrichten/${matchId}`,
    ''
  );
}

async function sendFzExpiryReminder(email, firstName, daysRemaining, expiresAt) {
  const isUrgent = daysRemaining <= 14;
  const subject = isUrgent
    ? `Zeitnest – Ihr Führungszeugnis läuft in ${daysRemaining} Tagen ab`
    : 'Zeitnest – Ihr Führungszeugnis läuft demnächst ab';
  const expiresFormatted = new Date(expiresAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  const text = `Hallo ${firstName},

Ihr bei Zeitnest hinterlegtes erweitertes Führungszeugnis nach §30a BZRG läuft am ${expiresFormatted} ab (in ${daysRemaining} Tagen).

So verlängern Sie Ihren Status:

1. Beantragen Sie online ein neues erweitertes Führungszeugnis:
   https://www.fuehrungszeugnis.bund.de/

   Für ehrenamtliche Tätigkeiten ist der Antrag in der Regel gebührenfrei.
   Bitten Sie das Bürgeramt um eine entsprechende Befreiung.

2. Sobald das Zeugnis bei Ihnen ist, laden Sie es bei Zeitnest hoch:
   ${BASE_URL}/konto

3. Wir prüfen das Dokument und löschen es nach Verifizierung wieder aus
   unserem Speicher. Ihr „Geprüft"-Badge bleibt bestehen.

Solange Ihr aktuelles Zeugnis noch gültig ist, sind Sie weiterhin als
geprüft sichtbar. Nach Ablauf entfällt das Badge.

Viele Grüße
Ihr Zeitnest-Team`;

  const body = `
<tr><td>
<h1 style="color:#e8725a;font-size:22px;margin:0 0 16px;">Ihr Führungszeugnis läuft am ${expiresFormatted} ab</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">Hallo ${firstName},</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">
  Ihr bei Zeitnest hinterlegtes erweitertes Führungszeugnis nach §30a BZRG
  läuft in <strong>${daysRemaining} Tagen</strong> (am ${expiresFormatted}) ab.
</p>

<h3 style="margin:24px 0 8px;font-size:16px;">So verlängern Sie Ihren Status</h3>
<ol style="font-size:15px;line-height:1.6;padding-left:18px;margin:0 0 16px;">
  <li style="margin-bottom:8px;">
    <a href="https://www.fuehrungszeugnis.bund.de/" style="color:#e8725a;">Neues erweitertes Führungszeugnis beantragen</a>.
    Für ehrenamtliche Tätigkeiten meist gebührenfrei.
  </li>
  <li style="margin-bottom:8px;">
    Zeugnis bei Zeitnest hochladen
    (Konto → „Erweitertes Führungszeugnis").
  </li>
  <li style="margin-bottom:8px;">
    Wir prüfen, das Dokument wird nach Verifizierung gelöscht,
    Ihr „Geprüft"-Badge bleibt bestehen.
  </li>
</ol>

<p style="margin:24px 0;text-align:center;">
  <a href="${BASE_URL}/konto" style="background-color:#e8725a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Zum Konto wechseln</a>
</p>

<p style="font-size:14px;line-height:1.5;margin:0;color:#5a6878;">
  Solange Ihr aktuelles Zeugnis noch gültig ist, sind Sie weiterhin als
  geprüft sichtbar. Nach Ablauf entfällt das Badge automatisch.
</p>
</td></tr>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject,
    text,
    html: htmlTemplate(subject, body),
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMatchRequestEmail,
  sendBookingCreatedEmail,
  sendBookingCancelledEmail,
  sendNewMessageEmail,
  sendFzExpiryReminder,
};
