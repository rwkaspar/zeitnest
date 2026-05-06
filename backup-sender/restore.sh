#!/bin/bash
# Lokales Restore aus einem Snapshot-Dump.
# Usage:
#   docker compose exec backup-sender /app/restore.sh /snapshots/daily/zeitnest-2026-05-01.dump
# Achtung: ÜBERSCHREIBT die laufende Datenbank!

set -e

DUMP=${1:?Usage: $0 <pfad-zum-dump>}

if [ ! -f "$DUMP" ]; then
  echo "Dump-Datei nicht gefunden: $DUMP"
  echo "Verfügbare Snapshots:"
  ls -lh /snapshots/daily/ /snapshots/weekly/ /snapshots/monthly/ 2>/dev/null || true
  exit 1
fi

echo "ACHTUNG: Folgender Dump wird in $PG_DB auf $PG_HOST importiert:"
echo "  $DUMP"
echo "Bestehende Daten werden überschrieben!"
read -p "Sicher? (yes/N) " confirm
if [ "$confirm" != "yes" ]; then
  echo "Abgebrochen."
  exit 0
fi

PGPASSWORD="$PG_PASSWORD" pg_restore \
  --host="$PG_HOST" \
  --port="$PG_PORT" \
  --username="$PG_USER" \
  --dbname="$PG_DB" \
  --clean --if-exists --no-owner --no-acl \
  "$DUMP"

echo "Restore abgeschlossen."
