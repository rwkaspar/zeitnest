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

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
