# Shared helpers for the OpenShip migration steps. Sourced, never executed.
# shellcheck shell=bash disable=SC2034

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$KIT_DIR/../.." && pwd)"
OPENSHIP_API="${OPENSHIP_API:-http://127.0.0.1:4000}"
OPENSHIP_SLUG="${OPENSHIP_SLUG:-aetherlink-academy}"
KIT_HOME="${KIT_HOME:-/root/aetherlink-academy-openship}"
BACKUP_DIR="${ACADEMY_BACKUP_DIR:-/root/aetherlink-academy-backups}"
LEGACY_HOME="${LEGACY_HOME:-/root/aetherlink-academy}"
LEGACY_APP=academy-app
LEGACY_PG=academy-postgres
TARGET_APP="${TARGET_APP_CONTAINER:-openship-$OPENSHIP_SLUG-app}"
TARGET_PG="${TARGET_PG_CONTAINER:-openship-$OPENSHIP_SLUG-postgres}"
STAGING_URL="${STAGING_URL:-http://127.0.0.1:4327}"
# Legacy env names the compose file sets itself; everything else in the legacy
# .env is copied into the OpenShip project env.
COMPOSE_OWNED_ENV='DATABASE_URL|REDIS_URL|NODE_EXTRA_CA_CERTS|HOST|PORT|PROOF_PORT|ACADEMY_DATA|ACADEMY_STORAGE|SOURCE_REVISION|POSTGRES_PASSWORD|REDIS_PASSWORD|ACADEMY_PORT_BIND'

die() { echo "openship-kit: $*" >&2; exit 1; }
say() { echo "== $*"; }

sha256() {
  if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

need() {
  local tool
  for tool in "$@"; do command -v "$tool" >/dev/null || die "missing host tool: $tool"; done
}

# The token only ever lives in a 0600 header file inside a 0700 temp dir, so
# it never appears in argv (ps, /proc) or in the log.
openship_session() {
  [[ -n "${OPENSHIP_TOKEN:-}" ]] || die "OPENSHIP_TOKEN is not set"
  [[ "$OPENSHIP_TOKEN" == opsh_pat_* ]] || die "OPENSHIP_TOKEN is not an OpenShip personal access token"
  OPENSHIP_TMP="$(mktemp -d)"
  chmod 700 "$OPENSHIP_TMP"
  trap 'rm -rf -- "$OPENSHIP_TMP"' EXIT
  (umask 077; printf 'Authorization: Bearer %s\n' "$OPENSHIP_TOKEN" > "$OPENSHIP_TMP/auth.header")
  unset OPENSHIP_TOKEN
}

# api METHOD PATH [BODY_FILE]
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS --fail-with-body -X "$method" -H @"$OPENSHIP_TMP/auth.header" -H 'Accept: application/json')
  if [[ -n "$body" ]]; then args+=(-H 'Content-Type: application/json' --data-binary @"$body"); fi
  curl "${args[@]}" "$OPENSHIP_API/api$path"
}

# Prints the project id for the Academy slug, or nothing.
project_id() {
  api GET /projects | jq -r --arg slug "$OPENSHIP_SLUG" '[.. | objects | select(.slug? == $slug and (.id? | type) == "string") | .id] | first // empty'
}

container_exists() { docker inspect --type container "$1" >/dev/null 2>&1; }
container_running() { [[ "$(docker inspect --type container --format '{{.State.Running}}' "$1" 2>/dev/null)" == true ]]; }

# Row counts for every table outside the system schemas, one "schema.table count" per line, sorted.
row_counts() {
  local container="$1" db="$2"
  docker exec -i -e PGDATABASE="$db" "$container" sh -c 'psql -U "$POSTGRES_USER" -v ON_ERROR_STOP=1 -qAt -F " " -f -' <<'SQL' | sort
CREATE TEMP TABLE kit_counts(t text, n bigint);
DO $$
DECLARE r record; c bigint;
BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables
           WHERE schemaname NOT IN ('pg_catalog', 'information_schema') AND schemaname NOT LIKE 'pg_toast%'
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I', r.schemaname, r.tablename) INTO c;
    INSERT INTO kit_counts VALUES (r.schemaname || '.' || r.tablename, c);
  END LOOP;
END $$;
SELECT t, n FROM kit_counts;
SQL
}

# Database name the legacy app uses, read from the path of DATABASE_URL in the
# legacy .env (the URL itself is never printed).
legacy_db_name() {
  local name
  name="$(grep -E '^DATABASE_URL=' "$LEGACY_HOME/.env" | head -n1 | sed -E 's#^DATABASE_URL=["'"'"']?[a-z]+://[^/]*/([^?"'"'"']+).*#\1#')"
  [[ "$name" =~ ^[A-Za-z0-9_-]+$ ]] || die "could not read the database name from DATABASE_URL in $LEGACY_HOME/.env"
  echo "$name"
}
TARGET_DB=academy

# Writes KEY=value lines to a 0600 file atomically.
write_marker() {
  local file="$1"; shift
  local tmp="$file.tmp"
  (umask 077; printf '%s\n' "$@" > "$tmp")
  mv -f "$tmp" "$file"
}

marker_value() { grep -E "^$2=" "$1" | head -n1 | cut -d= -f2-; }
