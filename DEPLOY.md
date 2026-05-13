# Zeitnest - Deployment auf Proxmox/Docker

## Voraussetzungen
- Proxmox Host mit Docker LXC (z.B. via Community Helper Script)
- Docker & Docker Compose installiert
- Domain zeitnest.org zeigt auf die Server-IP

## 1. Repo klonen
```bash
git clone https://github.com/rwkaspar/zeitnest.git
cd zeitnest
```

## 2. Environment einrichten
```bash
cp .env.example .env
nano .env  # JWT_SECRET und DB_PASSWORD setzen!
```

## 3. Erster Start (ohne SSL)
```bash
# Nur App + Datenbank starten:
docker compose up -d db zeitnest

# Erreichbar unter http://<server-ip>:3001
```

## 4. SSL-Zertifikate holen
```bash
# Nginx-Verzeichnisse anlegen
mkdir -p nginx/certs

# Certbot einmalig ausfuehren
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d zeitnest.org -d www.zeitnest.org \
  --email kasparrobert@gmail.com \
  --agree-tos --no-eff-email

# Jetzt den vollen Stack starten
docker compose up -d
```

## 5. Fertig
- https://zeitnest.org sollte jetzt erreichbar sein
- Certbot erneuert Zertifikate automatisch
- DB-Daten liegen im Docker Volume `pgdata`

## E-Mail / SMTP-Setup

Zeitnest verschickt transaktionale E-Mails (Verifizierung, Passwort-Reset,
Match-/Booking-/Message-Notifications) über einen externen SMTP-Relay.

### Relevante Env-Variablen (`.env`)
```
SMTP_HOST=mail.neotactiq.ai
SMTP_PORT=587
SMTP_USER=relay@mail.neotactiq.ai
SMTP_PASSWORD=<aus Mailserver-Admin>
SMTP_FROM=noreply@zeitnest.org
BASE_URL=https://zeitnest.org
```

- Verbindung: STARTTLS auf Port 587 (`requireTLS: true`, siehe
  `backend/utils/mail.js:7`)
- Absender im Header: `"Zeitnest" <noreply@zeitnest.org>`
- `BASE_URL` wird in allen Mail-Links verwendet (Verify-Link, Reset-Link,
  CTA-Buttons)

### Relay-Konto
TODO: Wie wurde `relay@mail.neotactiq.ai` angelegt? (Mailserver-Software,
Admin-Zugang, wo liegt das Passwort gesichert?)

### DNS-Records für `zeitnest.org`
Damit Mails nicht im Spam landen, sollten SPF/DKIM/DMARC gesetzt sein:

- **SPF**: TXT-Record auf `zeitnest.org`, der `mail.neotactiq.ai` als
  zulässigen Sender deklariert
- **DKIM**: vom Mailserver erzeugter Public Key als TXT-Record
  (`<selector>._domainkey.zeitnest.org`)
- **DMARC**: TXT auf `_dmarc.zeitnest.org` (mindestens `p=none` zum Start)

TODO: aktuellen Status der drei Records prüfen und hier eintragen
(z.B. via `dig TXT zeitnest.org`, `dig TXT _dmarc.zeitnest.org`).

### Test
```bash
# Im laufenden Backend-Container: Verbindung prüfen
docker compose exec zeitnest node -e "require('./backend/utils/mail.js')"

# End-to-End: User registrieren und Verify-Mail prüfen
```

## Nuetzliche Befehle
```bash
# Logs anschauen
docker compose logs -f zeitnest

# Neustart
docker compose restart zeitnest

# Update deployen
git pull
docker compose build zeitnest
docker compose up -d zeitnest

# DB Backup
docker compose exec db pg_dump -U zeitnest zeitnest > backup_$(date +%Y%m%d).sql

# DB Restore
cat backup.sql | docker compose exec -T db psql -U zeitnest zeitnest
```
