# Zeitnest - Zeit schenken. Zeit gewinnen.

Vermittlungsplattform, die Generationen verbindet: Senioren schenken Zeit, Kinder erleben Abenteuer, Eltern gewinnen Freiraum.

## Schnellstart

### Alles auf einmal (Produktion)
```bash
cd backend
npm install
node server.js
# Webapp erreichbar unter http://localhost:3001
```
Das Backend liefert das fertig gebaute Frontend aus `frontend/dist/` automatisch aus.

### Frontend-Entwicklung
```bash
cd frontend
npm install
npm run dev
# Dev-Server auf http://localhost:3000 (Proxy zu Backend auf :3001)
```

## Demo-Zugangsdaten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Leih-Oma | maria.schmidt@example.de | demo1234 |
| Leih-Opa | hans.mueller@example.de | demo1234 |
| Leih-Oma | ingrid.weber@example.de | demo1234 |
| Elternteil | lisa.braun@example.de | demo1234 |
| Elternteil | thomas.wagner@example.de | demo1234 |

## Tech-Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Node.js, Express, sql.js (SQLite)
- **Auth:** JWT, bcrypt
- **Styling:** Custom CSS mit CSS Variables

## MVP-Funktionen

- Registrierung & Login (Elternteil oder Leih-Großelternteil)
- Profilseiten mit rollenspezifischen Details
- Suche nach Stadt/PLZ
- Kontaktanfragen senden & verwalten
- Nachrichtensystem zwischen verbundenen Nutzern
- Kennenlern-Leitfaden (Schritt für Schritt)
- Bewertungssystem
- Responsive Design
