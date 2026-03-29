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
