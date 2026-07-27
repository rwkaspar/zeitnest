# TODO — Arbeitsliste (autonomer Modus)

> Abgeleitet aus `VISION.md` Abschnitt 10. Regeln: `CLAUDE.md` → „Autonomer Modus".
> Priorität = Reihenfolge in der Liste. Abhängigkeiten stehen am Task.

## Aktuelle Phase

**Phase 2 — Rollen öffnen** (Phase 1 „Wunschgroßeltern-Kern" ist laut VISION.md ✅).

*Fertig heißt:* Bestands-Accounts funktionieren unverändert (Migration additiv,
Demo-Regionen intakt); eine neue Helfer-Kategorie ist Ende-zu-Ende nutzbar
(Registrierung → Verifizierung → Matching → Vermittlung); Wunschgroßeltern-Flows
sind visuell und funktional unverändert.

**Hinweis zur Autonomie-Grenze:** Das „Ende-zu-Ende" (Registrierungs-UI, Profil-UI,
Such-UI) ist Nutzer-sichtbar bzw. Auth-nah → DECISION NEEDED. Autonom umsetzbar ist
das komplette Daten- und API-Fundament darunter. Die Phase endet in dieser Session
also planmäßig mit offenen Maintainer-Entscheidungen.

## Tasks (priorisiert, mit Checkboxen, nach Abhängigkeiten geordnet)

- [x] **T0 — Setup:** TODO.md + PROGRESS.md anlegen, Phase zerlegen.
      *Fertig, wenn:* beide Dateien committed auf Feature-Branch.
- [x] **T1 — Konstanten Helfer-Kategorien & Skills:** `HELPER_CATEGORIES` und `SKILLS`
      in `backend/constants/profileOptions.js` (Quelle der Wahrheit) + Spiegel mit
      deutschen Labels in `frontend/src/constants/profileOptions.js`.
      *Fertig, wenn:* beide Dateien konsistent (gleiche Values), Syntax-Check grün.
- [x] **T2 — Additive Migration:** `grandparent_profiles.helper_category TEXT DEFAULT
      'grandparent'` + `skills TEXT[]` — nur `ADD COLUMN IF NOT EXISTS`, idempotent,
      keine Bestandsdaten angefasst. *(abhängig von T1 für Naming)*
      *Fertig, wenn:* `database.js` Syntax-Check grün; Migration rein additiv.
- [x] **T3 — API liest/schreibt neue Felder:** `PUT /profiles/me` validiert
      `helper_category`/`skills` gegen Konstanten (COALESCE-Muster beachten);
      `GET /auth/me`, `GET /profiles/:id` und Coordinator-Grandparents-Liste liefern
      sie additiv mit. *(abhängig von T2)*
      *Fertig, wenn:* Syntax-Check grün; bestehende Response-Felder unverändert.
- [x] **T4 — Such-Backend rückwärtskompatibel erweitern:** `GET /search` akzeptiert
      optionale Filter `helper_category`/`skills`; ohne Parameter exakt heutiges
      Verhalten. Sichtbarkeits-Gates und PLZ-Logik unangetastet. *(abhängig von T3)*
      *Fertig, wenn:* Diff zeigt: nur additive WHERE-Bedingungen hinter Param-Guards.
- [x] **T5 — Unit-Tests Konstanten-Validierung:** Tests für `validateSubset`/
      `validateOne` + neue Konstanten mit Node-Builtin `node --test` (keine neue
      Dependency), lauffähig via `docker run node:20-alpine`. *(abhängig von T1)*
      *Fertig, wenn:* Testlauf im Container grün.
- [x] **T6 — Frontend-Build-Smoke:** `vite build` im Wegwerf-Container (nicht Prod-
      Stack) beweist, dass der Konstanten-Spiegel das Bundle nicht bricht.
      *Fertig, wenn:* Build exit 0. *(abhängig von T1)*
- [ ] **T7 — PR öffnen:** Branch pushen, PR mit Zusammenfassung + Liste der
      DECISION-NEEDED-Punkte. *Fertig, wenn:* PR-URL in PROGRESS.md steht.

## Später (erkannt, aber bewusst zurückgestellt)

- **Registrierungs-Flow mit Kategorie-Auswahl** — Auth-nah + Nutzer-sichtbar → DECISION NEEDED (in PROGRESS.md mit Empfehlung).
- **Profil-/EditProfile-UI für Kategorie & Skills** — Nutzer-sichtbar → DECISION NEEDED.
- **Such-UI-Filter (Frontend)** — Nutzer-sichtbar → DECISION NEEDED.
- **Rollen-Begriff im UI verallgemeinern** („Wunschgroßeltern finden" → „Helfende finden") — Wording ist Maintainer-Sache.
- **`users.role`-Generalisierung über Kategorie-Spalte hinaus** (z. B. `helper` als Rolle) — Schema-Änderung über additiv hinaus → DECISION NEEDED.
- **Trust-Level-Generalisierung, FZ für Nicht-Großeltern-Kategorien** — Kinderschutz-relevant, nie autonom.
- Alles aus **Phase 3+** (Event-System, Notfall-Pool, Zeitbank, Föderation) — nicht vorziehen.
