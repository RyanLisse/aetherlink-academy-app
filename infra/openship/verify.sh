#!/usr/bin/env bash
# Checks the OpenShip-served Academy after migrate-data and records the result
# in $BACKUP_DIR/verify-passed.env, which cutover and decommission require.
# Before cutover it checks the loopback staging port; after cutover, :4317.
set -Eeuo pipefail
umask 077

# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
need docker curl jq
STATE="$KIT_HOME/state.env"
MIGRATED="$BACKUP_DIR/migrate-done.env"
MARKER="$BACKUP_DIR/verify-passed.env"
[[ -f "$MIGRATED" ]] || die "no $MIGRATED; run migrate-data first"
[[ -f "$STATE" ]] || die "no $STATE; run deploy first"
base="$STAGING_URL"
if [[ "$(marker_value "$STATE" phase)" == cutover ]]; then base=http://127.0.0.1:4317; fi
sha="$(marker_value "$STATE" deployed_sha)"
rm -f "$MARKER"
failures=0
check() {
  local name="$1"; shift
  if "$@"; then echo "PASS $name"; else echo "FAIL $name"; failures=$((failures + 1)); fi
}

health_ok() {
  curl -fsS --max-time 10 "$base/game/health" | jq -e --arg sha "$sha" '.ok == true and .proof == true and .revision == $sha' >/dev/null
}
config_ok() {
  curl -fsS --max-time 10 "$base/game/config" | jq -e '.portal == true and (.googleSso | type) == "boolean"' >/dev/null
}
unknown_room_rejected() {
  local body status
  body="$(mktemp)"
  status="$(curl -sS --max-time 10 -o "$body" -w '%{http_code}' -H 'Content-Type: application/json' \
    --data '{"code":"ZZZZZZ","name":"OpenShip verify"}' "$base/game/join")"
  [[ "$status" == 404 ]] && jq -e '.error == "Kamercode niet gevonden."' "$body" >/dev/null
}
room_join_ok() {
  [[ -z "${VERIFY_ROOM_CODE:-}" ]] && { echo "  VERIFY_ROOM_CODE not set: real join skipped"; return 0; }
  jq -n --arg code "$VERIFY_ROOM_CODE" '{code: $code, name: "OpenShip verify"}' |
    curl -fsS --max-time 10 -H 'Content-Type: application/json' --data @- "$base/game/join" >/dev/null
}
row_counts_match() {
  local legacy_db
  legacy_db="$(legacy_db_name)"
  row_counts "$TARGET_PG" "$TARGET_DB" > "$BACKUP_DIR/verify.counts.target"
  if container_running "$LEGACY_PG"; then
    row_counts "$LEGACY_PG" "$legacy_db" > "$BACKUP_DIR/verify.counts.source"
  else
    cp "$(marker_value "$MIGRATED" counts)" "$BACKUP_DIR/verify.counts.source"
  fi
  if [[ "$(marker_value "$STATE" phase)" == cutover ]]; then
    # After cutover the new instance takes writes: every migrated table must
    # still exist with at least the migrated number of rows.
    awk 'NR == FNR {want[$1] = $2; next} ($1 in want) && $2 >= want[$1] {ok++} END {exit ok != length(want)}' \
      "$BACKUP_DIR/verify.counts.source" "$BACKUP_DIR/verify.counts.target"
  else
    diff -u "$BACKUP_DIR/verify.counts.source" "$BACKUP_DIR/verify.counts.target"
  fi
}

echo "Verifying $base (revision $sha)"
check "per-table row counts match the migrated dump" row_counts_match
check "Academy and Proof healthy at the deployed revision" health_ok
check "/game/config answers" config_ok
check "join with an unknown room code reaches the database and is refused" unknown_room_rejected
check "join an existing room (VERIFY_ROOM_CODE, runs last because it writes)" room_join_ok
if container_running "$LEGACY_APP"; then echo "FAIL $LEGACY_APP is running and could write to the old database"; failures=$((failures + 1)); fi

(( failures == 0 )) || die "$failures check(s) failed; no verify marker written"
dump="$(marker_value "$MIGRATED" dump)"
write_marker "$MARKER" "status=passed" "at=$(date -u +%Y%m%dT%H%M%SZ)" "url=$base" "revision=$sha" \
  "dump=$dump" "dump_sha256=$(marker_value "$MIGRATED" dump_sha256)" \
  "tables=$(marker_value "$MIGRATED" tables)" "rows=$(marker_value "$MIGRATED" rows)"
echo "Verified. Marker: $MARKER"
