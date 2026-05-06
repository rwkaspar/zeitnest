#!/bin/bash
set -e

BACKUP_HOUR=${BACKUP_HOUR:-3}
BACKUP_MINUTE=${BACKUP_MINUTE:-0}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Backup-Sender gestartet (Zeitnest)"
log "Geplante Zeit: ${BACKUP_HOUR}:$(printf '%02d' "$BACKUP_MINUTE") Europe/Berlin"

# Initial run zum Verifizieren
log "Initial-Backup zur Verifizierung..."
if /app/backup.sh; then
  log "Initial-Backup erfolgreich."
else
  log "WARNUNG: Initial-Backup fehlgeschlagen — Container läuft trotzdem weiter."
fi

# Endlosschleife: bis zur nächsten geplanten Zeit warten, dann Backup laufen lassen
while true; do
  NOW_EPOCH=$(date +%s)
  TARGET_TODAY=$(date -d "today ${BACKUP_HOUR}:$(printf '%02d' "$BACKUP_MINUTE")" +%s)
  TARGET_TOMORROW=$(date -d "tomorrow ${BACKUP_HOUR}:$(printf '%02d' "$BACKUP_MINUTE")" +%s)

  if [ "$NOW_EPOCH" -lt "$TARGET_TODAY" ]; then
    SLEEP_SECS=$((TARGET_TODAY - NOW_EPOCH))
  else
    SLEEP_SECS=$((TARGET_TOMORROW - NOW_EPOCH))
  fi

  log "Warte ${SLEEP_SECS}s bis zum nächsten Backup..."
  sleep "$SLEEP_SECS"

  log "Starte geplantes Backup."
  /app/backup.sh || log "FEHLER: Backup fehlgeschlagen."
done
