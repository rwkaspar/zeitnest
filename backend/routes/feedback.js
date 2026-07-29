const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryOne, runSql } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');
const { askOllamaJson, OLLAMA_MODEL } = require('../utils/ollama');
const { listOpenIssues, createIssue } = require('../utils/github');

const router = express.Router();

// Auth ist optional: eingeloggte Melder werden verknüpft (nur intern in der DB),
// anonyme Meldungen sind ausdrücklich erlaubt.
function optionalAuth(req, _res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* anonym weiter */ }
  }
  next();
}

router.post('/', optionalAuth, async (req, res) => {
  try {
    const type = ['bug', 'feature'].includes(req.body.type) ? req.body.type : null;
    const description = String(req.body.description || '').trim();
    const pagePath = String(req.body.page_path || '').trim().slice(0, 200) || null;

    if (!type) return res.status(400).json({ error: 'Typ muss "bug" oder "feature" sein.' });
    if (description.length < 10 || description.length > 2000) {
      return res.status(400).json({ error: 'Beschreibung bitte zwischen 10 und 2000 Zeichen.' });
    }

    const id = uuidv4();
    await runSql(
      `INSERT INTO feedback_reports (id, user_id, type, description, page_path) VALUES ($1, $2, $3, $4, $5)`,
      [id, req.user?.id || null, type, description, pagePath]
    );

    // Sofort antworten — KI-Check + GitHub-Issue laufen im Hintergrund.
    res.status(201).json({ message: 'Danke! Ihre Meldung wird geprüft.' });
    setImmediate(() => processFeedback(id).catch((err) => {
      console.error(`[feedback] Verarbeitung ${id} fehlgeschlagen:`, err.message);
    }));
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Meldung konnte nicht gespeichert werden.' });
  }
});

async function processFeedback(id) {
  const report = await queryOne('SELECT * FROM feedback_reports WHERE id = $1', [id]);
  if (!report) return;

  const issues = await listOpenIssues();

  // 1) KI-Stufe 1: nur einen guten deutschen Issue-Titel formulieren.
  let verdict = null;
  if (issues) {
    verdict = await askOllamaJson(
      `Formuliere einen prägnanten deutschen GitHub-Issue-Titel für eine Nutzer-Meldung.
Der Titel benennt konkret das gemeldete Problem bzw. den gewünschten Zweck —
keine Umdeutung, nichts hinzuerfinden.
Antworte NUR mit JSON: {"title": "<deutscher Issue-Titel, max. 80 Zeichen>"}`,
      `Meldung (Typ: ${report.type === 'bug' ? 'Fehler' : 'Feature-Wunsch'}, Seite: ${report.page_path || 'unbekannt'}):
"""${report.description}"""`
    );
  }

  // 2) KI-Stufe 2: binärer Paarvergleich gegen jedes offene Issue desselben Typs
  //    (max. 30, neueste zuerst). Der Einzelvergleich ist die einzige Aufgabe,
  //    die das kleine Modell zuverlässig löst — eine Kandidaten-Vorauswahl
  //    durch das Modell hat sich als unzuverlässig erwiesen.
  let dupNumber = NaN;
  const typeLabel = report.type === 'bug' ? 'bug' : 'enhancement';
  const candidates = (issues || [])
    .filter((i) => !i.labels.length || i.labels.includes(typeLabel))
    .slice(0, 30);
  for (const candidate of candidates) {
    const compare = await askOllamaJson(
      `Vergleiche zwei Texte. Antworte NUR mit JSON: {"same_topic": true|false}.
same_topic ist true, wenn beide Texte im Kern denselben Wunsch oder dasselbe
Problem beschreiben, auch mit anderen Worten.`,
      `Text A: ${candidate.title}
${candidate.body}

Text B: ${report.description}`
    );
    console.log(`[feedback] compare ${id} vs #${candidate.number}: ${JSON.stringify(compare)}`);
    if (compare?.same_topic === true) {
      dupNumber = candidate.number;
      verdict = { ...verdict, same_topic_with: candidate.number };
      break;
    }
  }

  // 3) Duplikat → nur vermerken, kein neues Issue.
  if (Number.isFinite(dupNumber) && issues?.some((i) => i.number === dupNumber)) {
    await runSql(
      `UPDATE feedback_reports SET status = 'duplicate', duplicate_of = $1, ai_verdict = $2 WHERE id = $3`,
      [dupNumber, JSON.stringify(verdict), id]
    );
    console.log(`[feedback] ${id} als Duplikat von #${dupNumber} eingestuft`);
    return;
  }

  // 4) Neu → GitHub-Issue. Kein Klarname/keine E-Mail im öffentlichen Issue!
  const fallbackTitle = report.description.replace(/\s+/g, ' ').slice(0, 70);
  const title = `${report.type === 'bug' ? '[Bug]' : '[Feature]'} ${verdict?.title || fallbackTitle}`;
  const aiNote = verdict
    ? `Duplikat-Check: ${OLLAMA_MODEL}, kein Duplikat gefunden.`
    : 'Duplikat-Check nicht möglich (KI/GitHub nicht erreichbar) — bitte manuell prüfen.';
  const body = `**Typ:** ${report.type === 'bug' ? 'Fehler-Meldung' : 'Feature-Wunsch'}
**Seite:** \`${report.page_path || 'unbekannt'}\`
**Rolle:** ${report.user_id ? 'eingeloggte Nutzer:in' : 'anonym'}

**Beschreibung (aus dem Feedback-Widget):**

> ${report.description.replace(/\n/g, '\n> ')}

---
_Automatisch erstellt (Report \`${report.id}\`). ${aiNote}_`;

  const issue = await createIssue(title, body, ['user-feedback', report.type === 'bug' ? 'bug' : 'enhancement']);
  if (issue) {
    await runSql(
      `UPDATE feedback_reports SET status = 'issue_created', github_issue_url = $1, ai_verdict = $2 WHERE id = $3`,
      [issue.url, verdict ? JSON.stringify(verdict) : null, id]
    );
    console.log(`[feedback] ${id} → Issue #${issue.number}`);
  } else {
    await runSql(
      `UPDATE feedback_reports SET status = 'pending', ai_verdict = $1 WHERE id = $2`,
      [verdict ? JSON.stringify(verdict) : null, id]
    );
    console.log(`[feedback] ${id} wartet (GitHub nicht erreichbar) — bleibt in der DB`);
  }
}

module.exports = router;
