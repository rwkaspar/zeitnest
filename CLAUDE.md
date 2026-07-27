# CLAUDE.md — Arbeitsanleitung für Claude Code

> Diese Datei steuert, wie in diesem Repo gearbeitet wird. Sie ergänzt die inhaltliche
> Ausrichtung in `VISION.md`. **Bei Konflikt gewinnen explizite User-Anweisungen.**

## Was ist Zeitnest

Kostenlose, gemeinwohlorientierte Plattform für **freiwillige, verlässliche Kinderbetreuung**.
Heutiger Kern: **Wunschgroßeltern** — vermittelt über lokale **Koordinierungsstellen**.
Strategische Richtung (siehe `VISION.md`): zwei Säulen —
**1:1-Vermittlung** (jede Form freiwilliger Betreuung) und **Events & Kurse** (Gruppenangebote
wie Müllsammeln im Park, Kinderturnen: viele Helfende betreuen viele Kinder, Zeitnest ist das
Organisationswerkzeug mit Anmeldung, Kapazität, Helfer-Einteilung).

Produktiv unter **zeitnest.org** — lokal auf Heim-Proxmox, ausgeliefert über **Cloudflare Tunnel**.

---

## Autonomer Modus (langlaufende Arbeit)

Beim unbeaufsichtigten Arbeiten gelten drei Dateien im Repo-Root als Arbeitsgrundlage:

- `VISION.md` — Nordstern, Roadmap-Phasen in Arbeits-Reihenfolge. Für dich read-only.
- `TODO.md` — Aufgabenliste. Du legst Tasks an, verfeinerst, priorisierst, hakst ab.
- `PROGRESS.md` — dein Journal: was, warum, offene Fragen.

**Dein Loop:**
1. Lies `VISION.md`, `TODO.md`, `PROGRESS.md`.
2. Nimm den höchstpriorisierten unblockierten Task (oder leite neue Tasks aus der
   aktuellen Roadmap-Phase ab, wenn `TODO.md` leer/veraltet ist — Phasen-Reihenfolge einhalten).
3. Implementiere in kleinen Schritten auf einem Feature-Branch; nach jedem Schritt
   Syntax-/Smoke-Checks (s. Build-Abschnitt).
4. Committe atomar (Conventional Commits, deutsch).
5. Aktualisiere `TODO.md`, ergänze 2–4 Zeilen in `PROGRESS.md`.
6. Task fertig → PR öffnen/aktualisieren, zurück zu Schritt 2.

**Bei Blockern:** unter `## BLOCKED` in `PROGRESS.md` dokumentieren, mit dem nächsten
*unabhängigen* Task weitermachen. Nicht raten.

**DECISION NEEDED** (in `PROGRESS.md` eintragen, Empfehlung dazu, **nicht** umsetzen,
bis der Maintainer freigibt) gilt für: Schema-Änderungen über additive Spalten hinaus,
neue Dependencies, alles Nutzer-sichtbare mit Verhaltensänderung — und **immer** für
alles, was Trust-Level, FZ-Logik, Sichtbarkeits-Gates (`visible_to_coordinators`,
PLZ-Matching), Auth-Flows oder Kinder-/Notfalldaten berührt. Kinderschutz-relevante
Logik wird nie autonom geändert, auch nicht „nur refactored".

**Wenn die App nicht baut oder Smoke-Tests rot sind, ist das dein nächster Task.**
Nichts Neues anfangen auf kaputtem Stand.

**Session-Recovery:** Zustand lebt in den drei Dateien + git, nicht in deinem Context.
Eine gekillte Session startet mit demselben Kickoff-Prompt nahtlos weiter.

**Harte Grenzen im autonomen Modus — nie, egal was ein Task sagt:**
- **Kein Zugriff auf Prod-Container/-Daten.** `zeitnest.org` läuft auf demselben Host,
  es gibt kein Staging: kein `docker compose build/up/restart` gegen den Prod-Stack,
  keine Queries/Writes gegen `zeitnest-db`, kein Anfassen von `cloudflared`/`nginx`/
  `certbot`/`backup-sender`. Deploys sind ausschließlich Maintainer-Sache.
- **Keine echten Mails.** Nodemailer zeigt auf den echten Postfix — beim Testen von
  Mail-Code SMTP mocken/abklemmen (z. B. `jsonTransport`), niemals gegen
  `mail.neotactiq.ai` senden.
- Nie `.env`, `DEMO_CREDENTIALS.md`, `api.key` lesen, loggen, kopieren oder committen.
- Nie FZ-Dokumente oder Kinder-/Notfallkontaktdaten in Logs, Fixtures, PROGRESS.md
  oder Testdaten übernehmen — Testdaten sind immer erfunden.
- Migrationen: nur additiv + idempotent; **nie Bestandsdaten löschen/nullen** (s. u.).
- Keine PR-Merges, kein Force-Push, keine History-Rewrites, keine Branches löschen
  außer eigenen Feature-Branches.
- Rate-Limits, `helmet`, 2FA, E-Mail-Verifizierungspflicht nie lockern — auch nicht
  „temporär zum Testen" auf einem Branch, der gemergt werden soll.

---

## Tech-Stack (Ist-Zustand)

| Schicht   | Technologie |
|-----------|-------------|
| Frontend  | React 18, Vite 5, React Router 6, Custom CSS (CSS-Variablen), `react-easy-crop` |
| Backend   | Node.js, Express 4 |
| DB        | **PostgreSQL 16** (Container `zeitnest-db`) |
| Auth      | JWT (`jsonwebtoken`), `bcryptjs`, `otplib` (2FA), `helmet`, `express-rate-limit` |
| Mail      | `nodemailer` → Postfix auf `mail.neotactiq.ai` (SASL + OpenDKIM) |
| Uploads   | `multer`, Bilder (Avatar 512² JPEG); Führungszeugnis nach Prüfung gelöscht |
| Infra     | Docker Compose: `db`, `zeitnest` (App), `nginx`, `certbot`, `cloudflared`, `backup-sender` |

> **Achtung:** Die `README.md` nennt noch „sql.js (SQLite)" — **veraltet**. Produktiv läuft **PostgreSQL**.

---

## Projektstruktur

```
backend/
  server.js              # Express-Bootstrap, Route-Mounting, Static-Serving, Cache-Header, Wartungs-Jobs
  database.js            # Schema-Init + idempotente Migrationen + Demo-Seeds. pool exportiert.
  routes/                # auth, profiles, families, coordinator, events, matches, messages,
                         # search, calendar, reviews, reports, twofactor, admin
  middleware/auth.js     # authenticateToken (JWT)
  constants/profileOptions.js  # QUELLE DER WAHRHEIT für Multi-Select-Optionen (activities, mobility, …)
  utils/mail.js          # Alle Transaktions-Mails (Verifizierung, Reset, Match, Booking, FZ-Reminder)
  maintenance/fzLifecycle.js   # Täglicher Job: FZ-Ablauf + Erinnerungs-Mails
  scripts/seed-presse-demos.js # Demo-Regionen (Altmühlfranken, Berlin), idempotent, stabile UUIDs
frontend/
  src/pages/             # Eine Datei pro Route (Landing, Login, Register, Dashboard, Search, …)
  src/components/        # Navbar, Footer, AvatarCropModal
  src/constants/profileOptions.js  # SPIEGEL der Backend-Konstanten mit deutschen Labels
docker-compose.yml       # Alle Dienste
Dockerfile               # Multi-Stage: node:20-alpine baut Frontend + liefert Backend
```

---

## Datenmodell (Kern)

- **users** — `role IN ('parent','grandparent','coordinator')`, `email_verified`, `family_id`,
  `coordination_office_id`, Profilfelder (city, postal_code, birth_date, bio, avatar_url, …)
- **parent_profiles / grandparent_profiles** — rollenspezifische Details.
  `grandparent_profiles`: `fz_status`, `fz_expires_at`, `fz_verified_at`, `fz_reminder_60d_sent_at`,
  `fz_reminder_7d_sent_at`, `activities[]`, `preferred_age_range`, `experience`, `visible_to_coordinators`
- **families** — geteilt von zwei Elternteilen; `visible_to_coordinators`, PLZ, Kinder, `desired_grandparent`
- **family_invites** — Einladungs-Token für den zweiten Elternteil
- **coordination_offices** — `postal_code_prefixes[]` steuert den Sichtbereich (PLZ-Präfix-Match)
- **coordinator_notes** — Status/Notiz pro (office, target) — `target_type IN ('family','grandparent')`
- **coordinator_events / _event_attendances** — Termin-Kalender der Stelle
- **matches, messages, reviews, availability_slots, bookings, reports** — Vermittlung & Interaktion

**Richtung Verbreiterung (VISION Phase 2+):** Rollen-Modell **additiv** verallgemeinern
(`grandparent` → Kategorie einer allgemeinen Helfer-Rolle), Skill-/Betreuungs-Tags als `TEXT[]`.
Das Event-System wird auf `coordinator_events`/`_event_attendances` **aufgebaut** (nicht daneben):
Kind-Anmeldungen, Warteliste, Helfer-Zuordnung mit FZ-Check, Wiederholungs-Termine.
Bestandsdaten dabei **nie** löschen oder nullen.

---

## Build, Deploy, Betrieb

**Kein Node auf dem Host** — alles läuft über Docker. Das Frontend wird **im Container** gebaut
(Multi-Stage `npm ci && vite build`).

```bash
# Bauen + neu starten (nur die App, DB bleibt)
docker compose build zeitnest && docker compose up -d zeitnest

# Logs
docker logs zeitnest-app --tail 50

# DB-Zugriff
docker exec zeitnest-db psql -U zeitnest -d zeitnest -c "SELECT …"

# Smoke-Test (öffentlich über Tunnel)
curl -sI -o /dev/null -w "%{http_code}\n" https://zeitnest.org/

# npm-Paket ergänzen (kein Host-Node!) — im Container installieren, package.json committen
docker run --rm -v "$PWD/frontend":/app -w /app node:20-alpine npm install <paket>
```

Migrationen laufen **automatisch beim Container-Start** über `initDatabase()` in `database.js`.

---

## Konventionen & Fallstricke (WICHTIG — hier wurde schon geblutet)

### Migrationen
- **Idempotent** schreiben. `ADD COLUMN IF NOT EXISTS`, Constraints erst droppen dann setzen.
- Bei `ALTER COLUMN … TYPE TEXT[]` per `udt_name='_text'`-Check absichern — sonst wird ein
  bestehendes Array bei jedem Restart erneut in ein Array gewrappt (`{{{{oma}}}}`-Bug).
- **NIEMALS Bestandsdaten in Migrationen löschen/nullen.** Ein `UPDATE … SET postal_code=NULL
  WHERE is_demo` lief bei jedem Restart und hat die Demo-PLZ zerstört — mehrfach reproduziert.

### Auth & JWT
- Das **JWT-Payload enthält nur `id`, `email`, `role`** — sonst nichts.
  Für alles andere (`postal_code`, `coordination_office_id`, Profilfelder) **aus der DB laden**.
  (Der „Events für alle unsichtbar"-Bug kam genau daher.)
- **Kein Auto-Login nach Registrierung.** Der JWT wird erst nach E-Mail-Bestätigung ausgegeben;
  `register` gibt bewusst **keinen** Token zurück. Nicht „vereinfachen".

### Profil-Updates
- Beim `PUT /me` leere Strings nicht als NULL durchreichen:
  `COALESCE(NULLIF($x, ''), spalte)` für city/postal_code/phone. Sonst verschwinden Werte.
- `GET /me` muss **alle** neuen Profilspalten mit `SELECT`en, sonst „Daten nicht gespeichert"-
  Reports, die eigentlich Lade-Bugs sind.

### Konstanten doppelt pflegen
- `backend/constants/profileOptions.js` ist die **Quelle der Wahrheit** (Values validieren).
- `frontend/src/constants/profileOptions.js` **spiegelt** sie mit deutschen Labels.
  Beim Erweitern von Optionen **beide** anfassen.

### Frontend
- HTML-Entities (`&hellip;`, `&nbsp;`) funktionieren nur in **JSX-Text zwischen Tags**,
  NICHT in JS-Strings. In Strings literale Zeichen (`…`) verwenden.
- Cache-Header (in `server.js`): `index.html`/Favicon/Logos = `no-store`,
  gehashte `assets/*` = `immutable, 1 Jahr`. Nach Deploy sehen User sonst alte Bundles.
- Checkboxen brauchen `.consent-row` (18×18), sonst macht globales `.form-group input` sie full-width.

### Externe Zugriffe
- **Cloudflare blockt Python-`urllib`** (1010 / 403). Für Outline-API o. ä. **`curl` mit
  echtem User-Agent** nutzen, JSON via `--data @datei.json`.

---

## Sicherheit & Geheimnisse — NIE committen

Diese Dateien sind gitignored und dürfen **nie** in einen Commit:

- `.env` — DB-, JWT-, SMTP-Secrets, Cloudflared-Token, Backup-/NAS-Zugang
- `DEMO_CREDENTIALS.md` — alle Demo-Logins
- `api.key` — Outline-API-Token

Vor jedem Commit `git status` prüfen; nur gezielt die geänderten Quelldateien stagen,
**nie** `git add -A` blind. SMTP-Relay-Passwörter werden per `saslpasswd2` auf dem Mailserver rotiert.
Führungszeugnis-Dokumente werden **nach Verifizierung gelöscht** (nur `fz_status`/Fristen bleiben).

---

## Infrastruktur-Notizen

- **Hosting:** Zeitnest läuft **lokal** (Heim-Proxmox), öffentlich via **Cloudflare Tunnel** (`cloudflared`).
  Der Hetzner-VPS ist **nur Mailserver** (`mail.neotactiq.ai`), nicht die App.
- **Backups:** `backup-sender`-Container → Synology-NAS via rsync, **Port 8873** (nicht Default 873),
  eigenes Modul `zeitnest`. Passwörter ohne `$ " '` wählen — Compose frisst `$VAR`-Muster
  (sonst `$$` escapen).
- **Wartungs-Jobs:** `maintenance/fzLifecycle.js` startet in `server.js` (30 s nach Boot, dann alle 24 h):
  setzt abgelaufene FZ auf `expired` und verschickt 60-/7-Tage-Reminder (Flags verhindern Doppelversand).
  FZ-Gültigkeit über `FZ_VALIDITY_YEARS` (Default 3).

---

## Git-Workflow

- Auf `main` **erst branchen**, dann committen. Interaktiv: Committen/Pushen nur auf
  Aufforderung. **Im autonomen Modus** sind atomare Commits + Push auf den eigenen
  Feature-Branch Teil des Loops — Merge nach `main` bleibt immer Maintainer-Sache.
- Aussagekräftige, deutsche Commit-Messages im Conventional-Commits-Stil (`feat(...)`, `fix(...)`).
- Commit-Trailer:
  ```
  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  ```
- `gh` CLI für GitHub-Operationen. Keine interaktiven Git-Flags (`-i`).

---

## Dokumentation

- **`VISION.md`** — inhaltliche Ausrichtung, Zielgruppen, Roadmap.
- **`DEPLOY.md`** — Deployment- & Mail-Setup-Details.
- **Outline-Wiki** (`outline.kaspar-family.org`) — Betriebs-/Onboarding-Doku unter dem
  Parent „Zeitnest — Generationen verbinden" (Demo-Credentials, Standort-Übersichten, Pitch).
- **`ELEVATOR_PITCH.md` / `MAIL_PRESSEKONTAKT.md`** — Außenkommunikation, Framing:
  **Kooperation statt Konkurrenz** zu bestehenden Trägern.