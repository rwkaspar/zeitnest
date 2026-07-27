# PROGRESS — Journal (autonomer Modus)

## Standup

- **Phase 2 (Rollen öffnen): Daten-/API-Fundament komplett** — Konstanten (6 Kategorien / 12 Skills), additive Migration, validierende APIs, rückwärtskompatible Such-Filter, 7 Unit-Tests + Frontend-Build grün (alles im Wegwerf-Container, Prod unberührt).
- Branch `feature/phase2-rollen-oeffnen` gepusht; **PR #1 offen:** https://github.com/rwkaspar/zeitnest/pull/1
- **5 Maintainer-Entscheidungen offen** (Registrierungs-Auswahl, EditProfile-UI, Such-UI, Label-Wording, FZ-Pflicht neue Kategorien) — Details + Empfehlungen unter DECISION NEEDED.
- Kein Blocker mehr — `gh` ist installiert und verbunden.
- Nächster sinnvoller Schritt nach Freigabe: UI-Tasks (Entscheidungen 1–3) in TODO.md aufnehmen und umsetzen.

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
