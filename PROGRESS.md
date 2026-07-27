# PROGRESS — Journal (autonomer Modus)

## Standup

- **Phase 2 (Rollen öffnen) ist code-komplett** — nach Maintainer-Freigabe „1–5 wie empfohlen" sind jetzt auch Registrierung („Ich helfe als …"), EditProfile (Kategorie + Skills), Such-UI (Filter + Badges) umgesetzt; FZ-Pflicht gilt verifiziert für alle 6 Kategorien (T12, kein Code nötig).
- Fundament aus der ersten Session: Konstanten, additive Migration, validierende APIs, rückwärtskompatible Such-Filter, 7 Unit-Tests grün, `vite build` grün — alles im Wegwerf-Container, Prod unberührt.
- **PR #1 aktualisiert:** https://github.com/rwkaspar/zeitnest/pull/1 — bereit zum Review/Merge (Maintainer-Sache), Migration läuft beim nächsten Deploy automatisch.
- Keine Blocker, keine offenen Entscheidungen.
- Danach: Phase 3 (Events & Kurse) — neue Zerlegung in TODO.md bei Session-Start.

## DECISION NEEDED

*(derzeit nichts offen — Punkte 1–5 am 2026-07-27 vom Maintainer freigegeben:
„1–5 wie empfohlen". Umsetzung als T8–T12 in TODO.md. Historie:)*

1. **Registrierungs-Flow: Helfer-Kategorie wählbar machen** (Auth-nah + Nutzer-sichtbar). ✅ freigegeben
   *Empfehlung:* Rolle bleibt technisch `grandparent`; das Formular bekommt eine
   „Ich helfe als …"-Auswahl, die nur `helper_category` setzt. Verifizierungs-Flow
   (E-Mail-Pflicht, kein Auto-Login) bleibt byte-identisch.
2. **EditProfile-UI: Kategorie + Skills bearbeitbar** (Nutzer-sichtbar).
   *Empfehlung:* ChipGroup analog `activities`, nur für Helfer-Rolle sichtbar.
   API ist fertig (`PUT /profiles/me` validiert bereits).
3. **Such-UI: Filter für Kategorie/Skills** (Nutzer-sichtbar).
   *Empfehlung:* Dropdown Kategorie + Skill-Chips, Default „alle" (= heutiges
   Verhalten). Backend-Params existieren bereits (`helper_category`, `skills`).
4. **Wording:** Deutsche Labels der 6 Kategorien / 12 Skills liegen in
   `frontend/src/constants/profileOptions.js` — bitte prüfen/anpassen.
5. **FZ-Pflicht für neue Kategorien** (Kinderschutz — nie autonom).
   *Empfehlung:* identische FZ-Pflicht + Lifecycle für ALLE Helfer-Kategorien;
   technisch sofort möglich, da alle Kategorien in `grandparent_profiles` leben.

## BLOCKED

*(derzeit nichts — gh-CLI-Blocker am 2026-07-27 aufgelöst: Maintainer hat gh
installiert + authentifiziert, PR #1 ist offen)*

## Journal

*(neueste Einträge oben — Format: Datum — was, warum, offene Fragen)*

### 2026-07-27 — Merge + Deploy (Maintainer-Auftrag), Asset-Optimierung
- Vorab Bilder optimiert: 18 Landing-Illustrationen → WebP 768px/q82 (3,5 MB → 912 KB),
  Logo 456K → 16K. Referenzen in LandingPage.jsx umgestellt.
- PR #1 (Phase 2) + `feature/zeitnest-no-support-row` (FZ-Lifecycle) nach `main`
  gemergt; Konflikte in database.js/coordinator.js additiv aufgelöst (beides behalten).
- Deploy: Migration lief (4 neue Spalten, Bestand intakt: 5× grandparent, Demo-PLZ ok),
  Smoke 200, WebP wird ausgeliefert, FZ-Job lief ohne fällige Reminder (0 Mails).
- PR #1 von GitHub als merged erkannt. Phase 2 ist damit live. Nächste Phase: 3 (Events).

### 2026-07-27 — T8–T12: UI nach Freigabe „1–5 wie empfohlen"
- Registrierung: Backend nimmt `helper_category` validiert an (Default
  'grandparent', Auth-Flow byte-gleich); Frontend zeigt „Ich helfe als …"-Select
  nur bei Helfer-Rolle; Rollen-Karte heißt jetzt „Ich schenke Zeit".
- EditProfile: Kategorie-RadioGroup + Skills-ChipGroup im Helfer-Abschnitt;
  Such-UI: Kategorie-Dropdown („Alle Kategorien" = Default), Skill-Chips,
  Kategorie-Badge + Skill-Tags auf Ergebnis-Karten, Überschrift „Helfende finden".
- T12 verifiziert: alle FZ-Gates prüfen `role === 'grandparent'` — Rolle ist für
  alle Kategorien identisch, FZ-Upload/-Prüfung/-Lifecycle greifen also überall.
- `vite build` + Syntax-Checks grün (Wegwerf-Container). Offene Fragen: keine.

### 2026-07-27 — T1–T6 umgesetzt: Daten-/API-Fundament für offene Rollen
- Konstanten `HELPER_CATEGORIES` (6) + `SKILLS` (12) beidseitig, Konsistenz per
  Container-Check; additive Migration `helper_category` (Default 'grandparent')
  + `skills TEXT[]`; PUT/GET-APIs + Coordinator-Liste + Such-Filter (opt-in,
  rückwärtskompatibel); 7 Unit-Tests grün; `vite build` grün.
- Alle Checks liefen im `node:20-alpine`-Wegwerf-Container — Prod-Stack unberührt.
- Warum so: maximaler Phase-2-Fortschritt ohne DECISION-NEEDED-Grenzen zu reißen;
  alles Nutzer-sichtbare als 5 Entscheidungspunkte mit Empfehlung dokumentiert (oben).
- Offen: Maintainer-Entscheidungen 1–5; danach UI-Tasks in TODO.md aufnehmen.

### 2026-07-27 — Setup autonomer Modus, Phase 2 zerlegt
- Branch `feature/phase2-rollen-oeffnen` angelegt; TODO.md + PROGRESS.md erstellt.
- Aktuelle Phase aus VISION.md §10 abgeleitet: **Phase 2 — Rollen öffnen** (Phase 1 ✅).
- Zerlegung: autonom machbar ist das Daten-/API-Fundament (Konstanten, additive
  Migration, API-Felder, rückwärtskompatible Suche, Tests, Build-Smoke). Alles
  Nutzer-sichtbare (Registrierung, Profil-UI, Such-UI) landet als DECISION NEEDED.
- Offene Frage: keine — Start mit T1.
