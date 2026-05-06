#!/bin/bash
# Zeitnest Smoke Test
# Prüft, dass die wichtigsten Auth/Profil/Kalender/DSGVO-Flows funktionieren.
#
# Voraussetzungen:
#   - Server läuft (docker compose up -d)
#   - Zugriff auf den DB-Container (für Token-Lookup von Verification-Mails)
#
# Usage:
#   ./tests/smoke.sh                          # gegen https://zeitnest.org
#   ./tests/smoke.sh --reset                  # vorher App-Container neu starten (löscht Rate-Limit)
#   BASE=http://192.168.50.42:3001 ./tests/smoke.sh
#
# HINWEIS: Der Server limitiert Login/Register/Forgot auf 10 Requests/15 min.
# Beim mehrfachen Ausführen kurz hintereinander den --reset-Flag nutzen.
#
# Exit-Code 0 = alle Tests grün, 1 = mindestens ein Test fehlgeschlagen.

set -u

if [ "${1:-}" = "--reset" ]; then
  echo "Reset: zeitnest-app neu starten..."
  docker compose -f "$(dirname "$0")/../docker-compose.yml" restart zeitnest > /dev/null
  sleep 3
fi

BASE="${BASE:-https://zeitnest.org}"
DB_CONTAINER="${DB_CONTAINER:-zeitnest-db}"
DB_USER="${DB_USER:-zeitnest}"
DB_NAME="${DB_NAME:-zeitnest}"
TS=$(date +%s)
EMAIL_P="smoke-p-$TS@zeitnest-test.local"
EMAIL_G="smoke-g-$TS@zeitnest-test.local"
PASSWORD="Test1234"
NEW_PASSWORD="NewPass1234"

PASS=0
FAIL=0
FAILED_TESTS=()

# === Helpers ===
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo -e "  ${GREEN}✓${RESET} $name"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${RESET} $name"
    echo -e "    ${YELLOW}expected:${RESET} $expected"
    echo -e "    ${YELLOW}got:${RESET}      $actual" | head -c 300
    echo
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("$name")
  fi
}

api() {
  curl -sk "$@"
}

db_query() {
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "$1" | tr -d ' \n'
}

cleanup() {
  echo
  echo "Cleanup: smoke-Test-User löschen..."
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "DELETE FROM users WHERE email LIKE 'smoke-%@zeitnest-test.local'" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# === Tests ===
echo "Zeitnest Smoke Test gegen: $BASE"
echo "================================"
echo

echo "[1] Health Check"
RES=$(api "$BASE/api/health")
check "API health endpoint" '"status":"ok"' "$RES"
echo

echo "[2] Registrierung Eltern"
RES=$(api "$BASE/api/auth/register" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_P\",\"password\":\"$PASSWORD\",\"role\":\"parent\",\"first_name\":\"Pia\",\"last_name\":\"Parent\",\"city\":\"Berlin\"}")

if echo "$RES" | grep -q "Zu viele"; then
  echo -e "  ${RED}✗${RESET} Rate-Limit aktiv — bitte mit --reset neu starten oder 15 min warten."
  exit 1
fi

check "Eltern-Registrierung" '"token"' "$RES"
echo

echo "[3] Login ohne Verifizierung blockiert"
RES=$(api "$BASE/api/auth/login" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_P\",\"password\":\"$PASSWORD\"}")
check "Login fordert Verifizierung" '"unverified":true' "$RES"
echo

echo "[4] E-Mail-Verifizierung"
TOK=$(db_query "SELECT verification_token FROM users WHERE email='$EMAIL_P'")
RES=$(api "$BASE/api/auth/verify/$TOK")
check "Verifizierung mit gültigem Token" 'erfolgreich' "$RES"
echo

echo "[5] Login nach Verifizierung"
RES=$(api "$BASE/api/auth/login" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_P\",\"password\":\"$PASSWORD\"}")
check "Login erfolgreich" '"token"' "$RES"
TOKEN_P=$(echo "$RES" | grep -oP '"token":"\K[^"]+')
echo

echo "[6] /me Endpoint"
RES=$(api "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN_P")
check "/me liefert User-Daten" "\"email\":\"$EMAIL_P\"" "$RES"
echo

echo "[7] Großeltern-Registrierung + Verifizierung"
api "$BASE/api/auth/register" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_G\",\"password\":\"$PASSWORD\",\"role\":\"grandparent\",\"first_name\":\"Gerda\",\"last_name\":\"Grandma\",\"city\":\"Berlin\"}" > /dev/null
TOK=$(db_query "SELECT verification_token FROM users WHERE email='$EMAIL_G'")
api "$BASE/api/auth/verify/$TOK" > /dev/null
RES=$(api "$BASE/api/auth/login" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_G\",\"password\":\"$PASSWORD\"}")
check "Großeltern-Login" '"token"' "$RES"
TOKEN_G=$(echo "$RES" | grep -oP '"token":"\K[^"]+')
GP_ID=$(db_query "SELECT id FROM users WHERE email='$EMAIL_G'")
echo

echo "[8] Kalender-Slot anlegen"
RES=$(api "$BASE/api/calendar/slots" -X POST \
  -H "Authorization: Bearer $TOKEN_G" -H "Content-Type: application/json" \
  -d '{"day_of_week":2,"start_time":"14:00","end_time":"17:00"}')
check "Slot wird angelegt" '"day_of_week":2' "$RES"
echo

echo "[9] Eltern sieht Slots"
RES=$(api "$BASE/api/calendar/slots/$GP_ID" -H "Authorization: Bearer $TOKEN_P")
check "Slots sind sichtbar" '"start_time":"14:00:00"' "$RES"
SLOT_ID=$(echo "$RES" | grep -oP '"id":"\K[^"]+' | head -1)
echo

echo "[10] Buchung erstellen"
NEXT_TUE=$(date -d "next Tuesday" +%Y-%m-%d 2>/dev/null || \
  python3 -c "import datetime; d=datetime.date.today(); print(d + datetime.timedelta((1-d.weekday()) % 7 or 7))")
RES=$(api "$BASE/api/calendar/bookings" -X POST \
  -H "Authorization: Bearer $TOKEN_P" -H "Content-Type: application/json" \
  -d "{\"slot_id\":\"$SLOT_ID\",\"booking_date\":\"$NEXT_TUE\",\"note\":\"Smoke Test\"}")
check "Buchung erstellt" '"status":"confirmed"' "$RES"
BOOKING_ID=$(echo "$RES" | grep -oP '"id":"\K[^"]+' | head -1)
echo

echo "[11] ICS Export"
RES=$(api "$BASE/api/calendar/bookings/$BOOKING_ID/ics" -H "Authorization: Bearer $TOKEN_P")
check "ICS-Datei wird generiert" 'BEGIN:VCALENDAR' "$RES"
echo

echo "[12] Match-Anfrage"
RES=$(api "$BASE/api/matches" -X POST \
  -H "Authorization: Bearer $TOKEN_P" -H "Content-Type: application/json" \
  -d "{\"target_id\":\"$GP_ID\",\"message\":\"Hallo\"}")
check "Match-Anfrage erstellt" '"status":"pending"' "$RES"
echo

echo "[13] Schwaches Passwort abgelehnt"
RES=$(api "$BASE/api/auth/register" -X POST -H "Content-Type: application/json" \
  -d '{"email":"weak@x.de","password":"abc","role":"parent","first_name":"X","last_name":"Y"}')
check "Min. 8 Zeichen erzwungen" 'mindestens 8' "$RES"
echo

echo "[14] SQL-Injection abgewehrt"
RES=$(api "$BASE/api/auth/login" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"a@b.de' OR '1'='1\",\"password\":\"x\"}")
check "Login lehnt Injection ab" 'falsch' "$RES"
echo

echo "[15] Passwort-vergessen-Flow"
RES=$(api "$BASE/api/auth/forgot-password" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_P\"}")
check "Forgot-Password antwortet generisch" 'enn ein Konto' "$RES"
echo

echo "[16] Passwort-Reset"
RESET_TOK=$(db_query "SELECT reset_token FROM users WHERE email='$EMAIL_P'")
RES=$(api "$BASE/api/auth/reset-password" -X POST -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOK\",\"password\":\"$NEW_PASSWORD\"}")
check "Passwort wird geändert" 'erfolgreich' "$RES"
echo

echo "[17] Login mit neuem Passwort"
RES=$(api "$BASE/api/auth/login" -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_P\",\"password\":\"$NEW_PASSWORD\"}")
check "Neues Passwort funktioniert" '"token"' "$RES"
TOKEN_P=$(echo "$RES" | grep -oP '"token":"\K[^"]+')
echo

echo "[18] DSGVO Datenexport (Art. 20)"
RES=$(api "$BASE/api/auth/me/export" -H "Authorization: Bearer $TOKEN_P")
check "Datenexport liefert JSON" '"benutzer"' "$RES"
echo

echo "[19] DSGVO Account-Löschung (Art. 17)"
RES=$(api "$BASE/api/auth/me" -X DELETE -H "Authorization: Bearer $TOKEN_P")
check "Account wird gelöscht" 'unwiderruflich gelöscht' "$RES"
COUNT=$(db_query "SELECT COUNT(*) FROM users WHERE email='$EMAIL_P'")
check "User ist wirklich weg (DB)" '^0$' "$COUNT"
echo

# === Summary ===
echo "================================"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}✓ Alle $TOTAL Tests grün.${RESET}"
  exit 0
else
  echo -e "${RED}✗ $FAIL von $TOTAL Tests fehlgeschlagen:${RESET}"
  for t in "${FAILED_TESTS[@]}"; do
    echo -e "  - $t"
  done
  exit 1
fi
