#!/usr/bin/env bash
# Moves the legacy Academy data into the OpenShip project:
#   freeze legacy writes -> pg_dump (custom format, kept, 0600) -> restore into
#   the OpenShip Postgres -> per-table row-count comparison -> copy /data.
# Redis is not migrated: it only holds presence and screen-state keys with a TTL
# and Proof/Hocuspocus pub/sub (see infra/openship/RESEARCH.md).
# Exits non-zero on any row-count mismatch and leaves the target app stopped.
set -Eeuo pipefail
umask 077

# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
need docker
container_running "$LEGACY_PG" || die "$LEGACY_PG is not running"
container_exists "$TARGET_PG" || die "$TARGET_PG does not exist; run the deploy step first"
container_exists "$TARGET_APP" || die "$TARGET_APP does not exist; run the deploy step first"

legacy_db="$(legacy_db_name)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump="$BACKUP_DIR/$stamp.dump"

say "Freezing legacy writes: stopping $LEGACY_APP (maintenance window starts)"
if container_exists "$LEGACY_APP"; then
  docker update --restart=no "$LEGACY_APP" >/dev/null
  docker stop --time 30 "$LEGACY_APP" >/dev/null
fi

say "Dumping database $legacy_db from $LEGACY_PG to $dump"
docker exec -e PGDATABASE="$legacy_db" "$LEGACY_PG" sh -c 'pg_dump -U "$POSTGRES_USER" --format=custom --no-owner --no-privileges' > "$dump"
chmod 600 "$dump"
docker exec -i "$LEGACY_PG" pg_restore --list < "$dump" >/dev/null || die "dump $dump is not a readable custom-format archive"
echo "  $(wc -c < "$dump") bytes, sha256 $(sha256 "$dump")"

if [[ -d "$LEGACY_HOME/data" ]]; then
  say "Archiving $LEGACY_HOME/data"
  tar -C "$LEGACY_HOME" -czf "$BACKUP_DIR/$stamp.data.tgz" data
  chmod 600 "$BACKUP_DIR/$stamp.data.tgz"
fi

say "Restoring into $TARGET_PG (the OpenShip app is stopped meanwhile)"
docker stop --time 30 "$TARGET_APP" >/dev/null
container_running "$TARGET_PG" || docker start "$TARGET_PG" >/dev/null
docker exec -i -e PGDATABASE="$TARGET_DB" "$TARGET_PG" sh -c 'psql -U "$POSTGRES_USER" -v ON_ERROR_STOP=1 -q -f -' <<'SQL'
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT nspname FROM pg_namespace
           WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'public') AND nspname NOT LIKE 'pg\_%'
  LOOP
    EXECUTE format('DROP SCHEMA %I CASCADE', r.nspname);
  END LOOP;
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP TABLE public.%I CASCADE', r.tablename);
  END LOOP;
END $$;
SQL
docker exec -i "$TARGET_PG" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$1" --no-owner --no-privileges --exit-on-error --single-transaction' sh "$TARGET_DB" < "$dump"

say "Comparing per-table row counts"
row_counts "$LEGACY_PG" "$legacy_db" > "$BACKUP_DIR/$stamp.counts.source"
row_counts "$TARGET_PG" "$TARGET_DB" > "$BACKUP_DIR/$stamp.counts.target"
if ! diff -u "$BACKUP_DIR/$stamp.counts.source" "$BACKUP_DIR/$stamp.counts.target"; then
  die "row counts differ between $LEGACY_PG and $TARGET_PG; the target app stays stopped. Roll back with: docker start $LEGACY_APP"
fi
tables="$(wc -l < "$BACKUP_DIR/$stamp.counts.source" | tr -d ' ')"
rows="$(awk '{s += $2} END {print s + 0}' "$BACKUP_DIR/$stamp.counts.source")"
echo "  $tables tables, $rows rows, identical"

if [[ -d "$LEGACY_HOME/data" ]]; then
  say "Copying $LEGACY_HOME/data into $TARGET_APP:/data"
  docker cp -a "$LEGACY_HOME/data/." "$TARGET_APP:/data/"
fi

docker start "$TARGET_APP" >/dev/null
write_marker "$BACKUP_DIR/migrate-done.env" \
  "status=migrated" "at=$stamp" "dump=$dump" "dump_sha256=$(sha256 "$dump")" \
  "counts=$BACKUP_DIR/$stamp.counts.source" "tables=$tables" "rows=$rows"
say "Migrated. Next: the verify step. Until cutover the Academy is offline on :4317."
