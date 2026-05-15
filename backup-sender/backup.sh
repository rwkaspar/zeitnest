#!/bin/bash
set -e

PROJECT="zeitnest"
SNAP_ROOT="/snapshots"
DAILY_DIR="$SNAP_ROOT/daily"
WEEKLY_DIR="$SNAP_ROOT/weekly"
MONTHLY_DIR="$SNAP_ROOT/monthly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

DATE=$(date +%Y-%m-%d)
DOW=$(date +%u)   # 1-7 (Mon-Sun)
DOM=$(date +%d)   # 01-31
DAILY_FILE="$DAILY_DIR/${PROJECT}-${DATE}.dump"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# === 1) pg_dump ===
log "pg_dump läuft → $DAILY_FILE"
PGPASSWORD="$PG_PASSWORD" pg_dump \
  --host="$PG_HOST" \
  --port="$PG_PORT" \
  --username="$PG_USER" \
  --format=custom \
  --file="$DAILY_FILE" \
  "$PG_DB"

DUMP_SIZE=$(du -h "$DAILY_FILE" | cut -f1)
log "Dump erstellt ($DUMP_SIZE)"

# === 2) Wöchentlich (Sonntag) und monatlich (1. des Monats) kopieren ===
if [ "$DOW" = "7" ]; then
  cp "$DAILY_FILE" "$WEEKLY_DIR/${PROJECT}-week-${DATE}.dump"
  log "Wöchentliche Kopie angelegt."
fi

if [ "$DOM" = "01" ]; then
  cp "$DAILY_FILE" "$MONTHLY_DIR/${PROJECT}-month-${DATE}.dump"
  log "Monatliche Kopie angelegt."
fi

# === 3) Retention: täglich 7, wöchentlich 4, monatlich 12 ===
log "Retention wird angewendet..."
ls -1t "$DAILY_DIR"/${PROJECT}-*.dump 2>/dev/null | tail -n +8 | xargs -r rm -v
ls -1t "$WEEKLY_DIR"/${PROJECT}-week-*.dump 2>/dev/null | tail -n +5 | xargs -r rm -v
ls -1t "$MONTHLY_DIR"/${PROJECT}-month-*.dump 2>/dev/null | tail -n +13 | xargs -r rm -v

# === 4) rsync zur NAS ===
if [ -z "$NAS_TAILSCALE_IP" ] || [ -z "$RSYNC_ZEITNEST_PASSWORD" ]; then
  log "WARNUNG: NAS_TAILSCALE_IP oder RSYNC_ZEITNEST_PASSWORD nicht gesetzt — überspringe rsync."
  exit 0
fi

log "rsync zur NAS (${NAS_TAILSCALE_IP}:8873)..."
RSYNC_PASSWORD="$RSYNC_ZEITNEST_PASSWORD" rsync -avz --partial --port=8873 \
  "$SNAP_ROOT/" \
  "zeitnest@${NAS_TAILSCALE_IP}::zeitnest/"

log "Backup abgeschlossen."
