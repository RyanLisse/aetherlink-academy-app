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
TARGET_REDIS="${TARGET_REDIS_CONTAINER:-openship-$OPENSHIP_SLUG-redis}"
STAGING_URL="${STAGING_URL:-http://127.0.0.1:4327}"

# Health-check base. lib.sh defaults STAGING_URL to the pre-cutover staging port
# :4327. After cutover (state.env phase=cutover) or when domain.env is set, the
# app is on loopback :4317. cutover/domain already wrap with STAGING_URL=…:4317;
# bare `deploy` must rewrite the default too so it does not probe :4327 and exit 1.
# An explicit non-default STAGING_URL from the caller is left alone.
# Usage: pass STATE and DOMAIN_FILE paths (step.sh / verify.sh set them).
staging_health_url() {
  local state="${1:-${STATE:-}}"
  local domain_file="${2:-${DOMAIN_FILE:-}}"
  if [[ "${STAGING_URL}" != "http://127.0.0.1:4327" ]]; then
    echo "$STAGING_URL"
    return
  fi
  if [[ -n "$state" && -f "$state" && "$(marker_value "$state" phase)" == cutover ]]; then
    echo "http://127.0.0.1:4317"
    return
  fi
  if [[ -n "$domain_file" && -f "$domain_file" && -n "$(marker_value "$domain_file" domain)" ]]; then
    echo "http://127.0.0.1:4317"
    return
  fi
  echo "$STAGING_URL"
}

# Env names owned by compose / step.sh upserts — never copied from legacy .env.
# DATABASE_URL / REDIS_URL / SOURCE_REVISION are fully resolved secrets upserted by step.sh
# into project env only (compose must omit them on the app service — a literal
# dollar-brace same-key ref in compose shadows project env). POSTGRES_PASSWORD /
# REDIS_PASSWORD / ACADEMY_PORT_BIND are also kit-owned. Everything else in the
# legacy .env is copied.
COMPOSE_OWNED_ENV='DATABASE_URL|REDIS_URL|NODE_EXTRA_CA_CERTS|HOST|PORT|ACADEMY_DATA|ACADEMY_STORAGE|SOURCE_REVISION|POSTGRES_PASSWORD|REDIS_PASSWORD|ACADEMY_PORT_BIND'

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

# api_code METHOD PATH OUT_FILE [BODY_FILE]
# Writes the response body to OUT_FILE and prints the HTTP status code on stdout.
# Does not treat 4xx/5xx as failure (unlike api); used for create-or-reuse.
api_code() {
  local method="$1" path="$2" out="$3" body="${4:-}"
  local args=(-sS -o "$out" -w "%{http_code}" -X "$method" -H @"$OPENSHIP_TMP/auth.header" -H "Accept: application/json")
  if [[ -n "$body" ]]; then args+=(-H "Content-Type: application/json" --data-binary @"$body"); fi
  curl "${args[@]}" "$OPENSHIP_API/api$path"
}

# Prints the project id for OPENSHIP_SLUG (match slug or name), or nothing.
# Scoped PATs only see projects they were granted; create-only lists what they created.
# perPage=100 avoids missing the row on an unscoped token with many projects.
project_id() {
  api GET "/projects?perPage=100" | jq -r --arg s "$OPENSHIP_SLUG" '
    [.. | objects
     | select(((.slug? == $s) or (.name? == $s)) and ((.id? | type) == "string"))
     | .id] | first // empty'
}

# Academy host project id once created. Used as lookup/409 fallback when the
# slug is "academy". Override with OPENSHIP_PROJECT_ID. Do not delete this project.
academy_known_project_id() {
  if [[ -n "${OPENSHIP_PROJECT_ID:-}" ]]; then
    printf "%s" "$OPENSHIP_PROJECT_ID"
  elif [[ "$OPENSHIP_SLUG" == academy ]]; then
    printf "%s" "proj_PTFOnZxLMEKU4ys9"
  fi
}

# True if GET /projects/:id succeeds for this token (has read on that id).
project_readable() {
  local id="$1" code
  [[ -n "$id" ]] || return 1
  code="$(api_code GET "/projects/$id" "$OPENSHIP_TMP/project.get.json")"
  [[ "$code" == 200 ]]
}

# Resolve an existing project the token can use: list → state.env → known id.
# Prints the id or nothing. Does not create.
resolve_existing_project_id() {
  local id state="$KIT_HOME/state.env"
  id="$(project_id)"
  if [[ -n "$id" ]]; then printf "%s" "$id"; return 0; fi
  if [[ -f "$state" ]]; then
    id="$(marker_value "$state" project_id || true)"
    if [[ -n "$id" ]] && project_readable "$id"; then printf "%s" "$id"; return 0; fi
  fi
  id="$(academy_known_project_id)"
  if [[ -n "$id" ]] && project_readable "$id"; then printf "%s" "$id"; return 0; fi
  return 0
}

# Create the project when missing; on 409 CONFLICT reuse the existing one.
# Prints the project id on stdout. Progress messages go to stderr via say.
ensure_project_id() {
  local id http known
  id="$(resolve_existing_project_id)"
  if [[ -n "$id" ]]; then
    printf "%s" "$id"
    return 0
  fi

  say "Creating OpenShip project $OPENSHIP_SLUG" >&2
  http="$(api_code POST /projects "$OPENSHIP_TMP/created.json" "$KIT_DIR/academy.project.json")"
  case "$http" in
    200|201)
      id="$(jq -r '[.. | objects | select((.id? | type) == "string" and (.id | startswith("proj_"))) | .id] | first // empty' "$OPENSHIP_TMP/created.json")"
      [[ -n "$id" ]] || die "project create returned no id (HTTP $http)"
      printf "%s" "$id"
      return 0
      ;;
    409)
      say "Project $OPENSHIP_SLUG already exists (409); reusing" >&2
      id="$(resolve_existing_project_id)"
      if [[ -n "$id" ]]; then
        printf "%s" "$id"
        return 0
      fi
      known="$(academy_known_project_id)"
      die "POST /projects 409 CONFLICT for \"$OPENSHIP_SLUG\" but this token cannot read the existing project${known:+ ($known)}. Scoped PATs only list projects they created; after rotating OPENSHIP_TOKEN grant the existing id: --grant 'project:${known:-proj_…}:read,write,admin' (plus project:*:create and github_repository:RyanLisse/aetherlink-academy-app:read). See docs/runbooks/single-academy-openship.md. Do not delete the OpenShip project."
      ;;
    *)
      die "POST /projects failed (HTTP $http): $(head -c 1500 "$OPENSHIP_TMP/created.json" 2>/dev/null || true)"
      ;;
  esac
}

container_exists() { docker inspect --type container "$1" >/dev/null 2>&1; }
container_running() { [[ "$(docker inspect --type container --format '{{.State.Running}}' "$1" 2>/dev/null)" == true ]]; }

# Row counts for every user table, one "schema.table count" per line, sorted.
# Exclude catalog/toast/temp schemas and the helper temp table itself — otherwise
# kit_counts appears under pg_temp_* and self-counts differ between source/target.
row_counts() {
  local container="$1" db="$2"
  docker exec -i -e PGDATABASE="$db" "$container" sh -c 'psql -U "$POSTGRES_USER" -v ON_ERROR_STOP=1 -qAt -F " " -f -' <<'SQL' | sort
CREATE TEMP TABLE kit_counts(t text, n bigint);
DO $$
DECLARE r record; c bigint;
BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables
           WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
             AND schemaname NOT LIKE 'pg_toast%'
             AND schemaname NOT LIKE 'pg_temp%'
             AND tablename <> 'kit_counts'
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

# Docker named volume for the kit's Postgres data (OpenShip namespaces as
# openship-<slug>-<compose-volume-name>). Presence means a prior deploy already
# initialized Postgres with whatever POSTGRES_PASSWORD was in force then.
pgdata_volume_name() { printf 'openship-%s-pgdata' "$OPENSHIP_SLUG"; }
pgdata_volume_exists() { docker volume inspect "$(pgdata_volume_name)" >/dev/null 2>&1; }

# Print the value of KEY inside a container's Config.Env, or nothing.
# Values are never logged by callers; only used to rebuild secrets.env.
container_env_value() {
  local container="$1" key="$2" line
  container_exists "$container" || return 1
  line="$(docker inspect --type container --format '{{range .Config.Env}}{{println .}}{{end}}' "$container" \
    | grep -E "^${key}=" | head -n1 || true)"
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#*=}"
}

# True if GET /projects/:id/env lists KEY (secret VALUES are always masked as
# ENV_MASK / "••••••••" — never treat the masked value as a real password, and
# never PATCH service environment from a masked GET).
project_env_has_key() {
  local id="$1" key="$2"
  [[ -f "$OPENSHIP_TMP/project.env.json" ]] || return 1
  jq -e --arg k "$key" '[.data // [] | .[].key] | index($k) != null' "$OPENSHIP_TMP/project.env.json" >/dev/null
}

# Fetch production project env into OPENSHIP_TMP/project.env.json (keys + masked secrets).
fetch_project_env() {
  local id="$1"
  api GET "/projects/$id/env?environment=production" > "$OPENSHIP_TMP/project.env.json"
}

# Resolve POSTGRES_PASSWORD / REDIS_PASSWORD for deploy without drifting from an
# existing openship-*-pgdata volume.
#
# Order:
#   1. secrets.env on the host (kit plaintext source of truth)
#   2. else if project env already has both password keys: recover plaintext from
#      running postgres/redis containers into secrets.env (reuse — do not remint)
#   3. else if project has the keys (or pgdata volume exists) and
#      OPENSHIP_ROTATE_PASSWORDS is unset: refuse remint
#   4. else mint into secrets.env
#
# Writes secrets.env. Does not print password values. Call after openship_session
# and ensure_project_id (needs OPENSHIP_TMP + project id for the env GET).
ensure_db_passwords() {
  local id="$1"
  local secrets="$KIT_HOME/secrets.env"
  local pg_password="" redis_password=""
  local project_has_passwords=0 volume_present=0

  if [[ -f "$secrets" ]]; then
    pg_password="$(marker_value "$secrets" POSTGRES_PASSWORD || true)"
    redis_password="$(marker_value "$secrets" REDIS_PASSWORD || true)"
    if [[ -n "$pg_password" && -n "$redis_password" ]]; then
      say "Reusing Postgres/Redis passwords from $secrets"
      return 0
    fi
  fi

  fetch_project_env "$id" || die "could not list project env for $id"
  if project_env_has_key "$id" POSTGRES_PASSWORD && project_env_has_key "$id" REDIS_PASSWORD; then
    project_has_passwords=1
  fi
  pgdata_volume_exists && volume_present=1

  if (( project_has_passwords )); then
    say "Project env already has POSTGRES_PASSWORD and REDIS_PASSWORD (values masked); reusing"
    pg_password="$(container_env_value "$TARGET_PG" POSTGRES_PASSWORD || true)"
    redis_password="$(container_env_value "$TARGET_REDIS" REDISCLI_AUTH || true)"
    if [[ -n "$pg_password" && -n "$redis_password" ]]; then
      say "Recovered passwords from running postgres/redis containers into $secrets"
      write_marker "$secrets" "POSTGRES_PASSWORD=$pg_password" "REDIS_PASSWORD=$redis_password"
      return 0
    fi
    if [[ "${OPENSHIP_ROTATE_PASSWORDS:-}" == 1 ]]; then
      say "OPENSHIP_ROTATE_PASSWORDS=1: reminting (existing pgdata will need ALTER USER to match)"
    else
      die "project $id already has POSTGRES_PASSWORD/REDIS_PASSWORD but $secrets is missing and running containers did not yield plaintext. Restore $secrets from backup, or set OPENSHIP_ROTATE_PASSWORDS=1 to remint (breaks auth against existing $(pgdata_volume_name) until ALTER USER). Never PATCH service environment from a masked GET."
    fi
  elif (( volume_present )) && [[ "${OPENSHIP_ROTATE_PASSWORDS:-}" != 1 ]]; then
    die "volume $(pgdata_volume_name) exists but project env has no POSTGRES_PASSWORD/REDIS_PASSWORD and $secrets is missing. Restore $secrets or set OPENSHIP_ROTATE_PASSWORDS=1 (then ALTER USER on the volume). Refusing to openssl-rand against existing pgdata."
  fi

  say "Generating Postgres and Redis passwords into $secrets"
  write_marker "$secrets" "POSTGRES_PASSWORD=$(openssl rand -hex 24)" "REDIS_PASSWORD=$(openssl rand -hex 24)"
}
