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

### Relay-Konto auf `mail.neotactiq.ai`

Der Mailserver läuft auf einem separaten Hetzner-VPS (`neotactiq-vps`,
public IP `46.225.30.46`, erreichbar via Tailscale-Name `neotactiq-vps`).
Software-Stack:

- **Postfix 3.8.6** (Submission auf Port 587, SMTP auf 25)
- **Cyrus SASL** als Auth-Backend (`smtpd_sasl_type = cyrus`,
  `smtpd_sasl_path = smtpd`) — User-DB in `/etc/sasldb2`
- **OpenDKIM** für ausgehende Signatur (Multi-Tenant für mehrere Domains)

Multi-Tenant-Hinweis: derselbe Postfix bedient auch `guardiian.app`,
`urateme.app`, `dealmonitor.app`. Änderungen mit Vorsicht.

#### SASL-User
`relay@mail.neotactiq.ai` existiert in `sasldb2`. Passwort setzen/rotieren:
```bash
ssh root@neotactiq-vps
saslpasswd2 -c -u mail.neotactiq.ai relay        # interaktiv
# oder nicht-interaktiv:
echo -n 'NEUES_PASSWORT' | saslpasswd2 -p -c -u mail.neotactiq.ai relay
# prüfen:
sasldblistusers2
```

#### Berechtigung: welche From-Adressen darf der SASL-User benutzen?
Mapping in `/etc/postfix/sender_login` (hash-Map, `postmap` nach
Änderung). Aktueller Eintrag für Zeitnest:
```
@zeitnest.org    relay@mail.neotactiq.ai
```
Bedeutet: SASL-Login `relay@mail.neotactiq.ai` darf **jede** Adresse auf
`@zeitnest.org` als Absender setzen. Postfix erzwingt das via
`smtpd_sender_restrictions = ... reject_sender_login_mismatch ...`.

### DNS-Records für `zeitnest.org` (Stand 2026-05-13)

Alle drei Records sind bereits gesetzt und werden vom Mailserver matched:

```
zeitnest.org           TXT  "v=spf1 ip4:46.225.30.46 include:_spf.mx.cloudflare.net ~all"
_dmarc.zeitnest.org    TXT  "v=DMARC1; p=none; rua=mailto:dmarc@zeitnest.org; adkim=r; aspf=r"
default._domainkey.zeitnest.org  TXT  "v=DKIM1; h=sha256; k=rsa; p=MIIBIjAN...QIDAQAB"
```

- **SPF**: Autorisiert die Public IP `46.225.30.46` von `neotactiq-vps` +
  Cloudflare Email Routing (für die MX-Empfangsroute).
- **DKIM**: Selector `default`, RSA-Key. Privat-Key liegt in
  `/etc/opendkim/keys/zeitnest.org/default.private` auf `neotactiq-vps`,
  Public-Pendant in `default.txt` daneben.
  - `KeyTable`-Eintrag: `default._domainkey.zeitnest.org zeitnest.org:default:/etc/opendkim/keys/zeitnest.org/default.private`
  - `SigningTable`-Eintrag: `*@zeitnest.org default._domainkey.zeitnest.org`
- **DMARC**: `p=none` (Monitoring-Phase) — bei stabilem SPF/DKIM-Pass-Anteil
  später auf `quarantine`/`reject` heben.

Prüfen:
```bash
dig +short TXT zeitnest.org
dig +short TXT _dmarc.zeitnest.org
dig +short TXT default._domainkey.zeitnest.org
```

Eingehende Mails (z.B. an `dmarc@zeitnest.org`) laufen über
**Cloudflare Email Routing** — siehe MX-Records `route1/2/3.mx.cloudflare.net`.

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
