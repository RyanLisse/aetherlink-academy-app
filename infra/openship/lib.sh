# Shared helpers for the OpenShip migration steps. Sourced, never executed.
# shellcheck shell=bash disable=SC2034

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$KIT_DIR/../.." && pwd)"
OPENSHIP_API="${OPENSHIP_API:-http://127.0.0.1:4000}"
OPENSHIP_SLUG="${OPENSHIP_SLUG:-academy}"
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

# The Academy host has no jq and we do not install packages on it; fall back to the
# official image. File arguments live under /tmp (mktemp), mounted read-only.
JQ_IMAGE=ghcr.io/jqlang/jq:1.7.1
if ! command -v jq >/dev/null 2>&1 && command -v docker >/dev/null 2>&1; then
  jq() { docker run --rm -i -v /tmp:/tmp:ro "$JQ_IMAGE" "$@"; }
fi

# Frees space before a build without touching anything in use: unused aetherlink-academy*
# image tags (every legacy deploy left one behind) and build cache older than a day.
# Containers, volumes and images a container uses are never removed.
MIN_FREE_KB=$((4 * 1024 * 1024))
free_kb() { df -Pk / | awk 'NR==2 {print $4}'; }
free_disk() {
  say "Disk before: $(df -h / | awk 'NR==2 {print $4" free, "$5" used"}')"
  local in_use image
  in_use="$(docker ps -a --format '{{.Image}}' | sort -u)"
  while read -r image; do
    [[ -z "$image" ]] && continue
    grep -qxF "$image" <<<"$in_use" && continue
    docker image rm "$image" >/dev/null 2>&1 && echo "  removed unused image $image"
  done < <(docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^aetherlink-academy(-wave)?:' | grep -v ':latest$')
  docker image prune -f >/dev/null
  docker builder prune -af --filter until=24h >/dev/null 2>&1 || true
  say "Disk after: $(df -h / | awk 'NR==2 {print $4" free, "$5" used"}')"
  (( $(free_kb) >= MIN_FREE_KB )) || die "less than 4 GB free on / after pruning; refusing to build"
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
  # On failure OpenShip answers {error, code} (e.g. "Pre-deploy checks failed: ..."); show it,
  # since the caller's pipe would otherwise swallow the only explanation.
  local out status=0
  out="$(curl "${args[@]}" "$OPENSHIP_API/api$path")" || status=$?
  if (( status != 0 )); then
    echo "openship-kit: $method $path failed (curl $status): ${out:0:1500}" >&2
    # Scoped PATs need github_repository:owner/repo:read for POST /deployments
    # (assertGitHubRepoAccess). Surface the fix next to the raw body.
    if [[ "$out" == *'"code":"GITHUB_ACCESS_DENIED"'* || "$out" == *'"code": "GITHUB_ACCESS_DENIED"'* ]]; then
      echo "openship-kit: hint: recreate OPENSHIP_TOKEN with --grant 'github_repository:RyanLisse/aetherlink-academy-app:read' (plus project:*:create); see docs/runbooks/single-academy-openship.md" >&2
    fi
    return "$status"
  fi
  printf '%s' "$out"
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
