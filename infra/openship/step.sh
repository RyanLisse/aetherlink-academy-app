#!/usr/bin/env bash
# Host entry point for .github/workflows/openship-academy.yml.
# usage: step.sh plan|deploy|migrate-data|verify|cutover|decommission
set -Eeuo pipefail
umask 077

# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
STATE="$KIT_HOME/state.env"
SOURCE_SHA="${SOURCE_SHA:-$(git -C "$REPO_DIR" rev-parse HEAD)}"

legacy_env_names() {
  [[ -f "$LEGACY_HOME/.env" ]] || return 0
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$LEGACY_HOME/.env" | cut -d= -f1 | grep -Ev "^(${COMPOSE_OWNED_ENV})$" | sort -u
}

port_bind() {
  if [[ -f "$STATE" && "$(marker_value "$STATE" phase)" == cutover ]]; then echo 0.0.0.0:4317; else echo 127.0.0.1:4327; fi
}

plan() {
  say "Host tools"
  local tool
  for tool in docker curl jq openssl git; do
    if command -v "$tool" >/dev/null; then echo "  $tool: present"; else echo "  $tool: MISSING (deploy needs it)"; fi
  done
  say "Academy and OpenShip containers"
  docker ps -a --format '  {{.Names}}  {{.Status}}  {{.Ports}}' | grep -E '  (academy-|openship-)' || true
  say "Listeners on 80, 443, 4000, 4317, 4318, 4327"
  ss -ltnH 2>/dev/null | awk '{print $4}' | grep -E ':(80|443|4000|4317|4318|4327)$' | sed 's/^/  /' || true
  say "Legacy health"
  curl -fsS --max-time 5 http://127.0.0.1:4317/game/health | sed 's/^/  /' || echo "  legacy app not answering on 4317"
  echo
  say "Legacy database size"
  local db
  db="$(legacy_db_name)" || db=""
  if container_running "$LEGACY_PG" && [[ -n "$db" ]]; then
    docker exec -e PGDATABASE="$db" "$LEGACY_PG" sh -c 'psql -U "$POSTGRES_USER" -qAt -c "select pg_size_pretty(pg_database_size(current_database()))"' | sed 's/^/  /'
  else
    echo "  $LEGACY_PG is not running"
  fi
  say "Backup disk"
  df -h "$(dirname "$BACKUP_DIR")" | sed 's/^/  /'
  say "Docker disk usage (deploy prunes unused aetherlink-academy* images and old build cache)"
  docker system df | sed 's/^/  /'
  say "Legacy env names that deploy copies into OpenShip (values are never printed)"
  legacy_env_names | sed 's/^/  /'
  say "OpenShip project $OPENSHIP_SLUG"
  if [[ -n "${OPENSHIP_TOKEN:-}" ]]; then
    openship_session
    local id
    id="$(project_id)"
    if [[ -n "$id" ]]; then echo "  exists: $id"; else echo "  absent: deploy creates it from infra/openship/academy.project.json"; fi
  else
    echo "  OPENSHIP_TOKEN not set, skipped"
  fi
  say "Kit state"
  if [[ -f "$STATE" ]]; then sed 's/^/  /' "$STATE"; else echo "  none (nothing has run yet)"; fi
  cat <<EOF
== What each step would do
  deploy        create or update project $OPENSHIP_SLUG, turn auto-deploy off, copy the env names above,
                generate Postgres/Redis passwords and TLS under $KIT_HOME, deploy $SOURCE_SHA,
                serve it on $(port_bind) and check $STAGING_URL/game/health
  migrate-data  stop $LEGACY_APP (maintenance starts), pg_dump $LEGACY_PG to $BACKUP_DIR,
                restore into $TARGET_PG, compare row counts, copy $LEGACY_HOME/data into $TARGET_APP
  verify        health, /game/config, join smoke on the OpenShip app, row-count parity, write the marker
  cutover       bind the OpenShip app on 0.0.0.0:4317 and redeploy (maintenance ends)
  decommission  remove academy-app, academy-postgres, academy-redis, academy-wave-* and their volumes
EOF
}

deploy() {
  need docker curl jq openssl git
  free_disk
  openship_session
  mkdir -p "$KIT_HOME"
  chmod 700 "$KIT_HOME"

  local secrets="$KIT_HOME/secrets.env"
  if [[ ! -f "$secrets" ]]; then
    say "Generating Postgres and Redis passwords into $secrets"
    write_marker "$secrets" "POSTGRES_PASSWORD=$(openssl rand -hex 24)" "REDIS_PASSWORD=$(openssl rand -hex 24)"
  fi
  local pg_password redis_password
  pg_password="$(marker_value "$secrets" POSTGRES_PASSWORD)"
  redis_password="$(marker_value "$secrets" REDIS_PASSWORD)"
  say "TLS material in $KIT_HOME/tls"
  POSTGRES_PASSWORD="$pg_password" REDIS_PASSWORD="$redis_password" bash "$REPO_DIR/infra/deploy/init-tls.sh" "$KIT_HOME/tls"

  local id
  id="$(project_id)"
  if [[ -z "$id" ]]; then
    say "Creating OpenShip project $OPENSHIP_SLUG"
    api POST /projects "$KIT_DIR/academy.project.json" > "$OPENSHIP_TMP/created.json"
    id="$(jq -r '[.. | objects | select((.id? | type) == "string") | .id] | first // empty' "$OPENSHIP_TMP/created.json")"
    [[ -n "$id" ]] || die "project create returned no id"
  fi
  echo "  project: $id"
  # Self-hosted OpenShip cannot route the free .opsh.io endpoint that project create stores
  # (preflight CLOUD_REQUIRED_MANAGED_PROJECT_DOMAIN reads the stored publicEndpoints). Clear
  # them: the app is served by its compose-published port, which OpenShip leaves alone. A routed
  # endpoint would also be rewritten to loopback (loopback-publish.ts), hiding :4317 at cutover.
  # The academy.aetherlink.ai route is added together with DNS (AET-42), when TLS can issue.
  printf '{"publicEndpoints":[]}' > "$OPENSHIP_TMP/endpoints.json"
  api PATCH "/projects/$id" "$OPENSHIP_TMP/endpoints.json" >/dev/null
  echo "  public endpoints: none (served on the published port $(port_bind))"
  printf '{"enabled":false}' > "$OPENSHIP_TMP/auto.json"
  api POST "/projects/$id/auto-deploy" "$OPENSHIP_TMP/auto.json" >/dev/null
  echo "  auto-deploy: off (deploys happen only from this workflow)"

  say "Project env (names only)"
  [[ -f "$LEGACY_HOME/.env" ]] || die "legacy env file $LEGACY_HOME/.env is missing"
  {
    grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$LEGACY_HOME/.env" | grep -Ev "^(${COMPOSE_OWNED_ENV})="
    printf 'POSTGRES_PASSWORD=%s\nREDIS_PASSWORD=%s\nACADEMY_PORT_BIND=%s\nSOURCE_REVISION=%s\n' "$pg_password" "$redis_password" "$(port_bind)" "$SOURCE_SHA"
  } | jq -Rn '{environment: "production", deletes: [], upserts: [inputs
      | (index("=")) as $i
      | {key: .[:$i], value: (.[$i+1:] | if test("^\".*\"$") or test("^'"'"'.*'"'"'$") then .[1:-1] else . end)}
      | . + {isSecret: (.key | IN("ACADEMY_PORT_BIND", "SOURCE_REVISION") | not)}]}' > "$OPENSHIP_TMP/env.json"
  jq -r '.upserts[].key' "$OPENSHIP_TMP/env.json" | sed 's/^/  /'
  api PATCH "/projects/$id/env" "$OPENSHIP_TMP/env.json" >/dev/null

  say "Deploying $SOURCE_SHA"
  jq -n --arg p "$id" --arg c "$SOURCE_SHA" '{projectId: $p, branch: "main", commitSha: $c, environment: "production"}' > "$OPENSHIP_TMP/deploy.json"
  local deployment status="" deadline=$((SECONDS + 35 * 60))
  deployment="$(api POST /deployments "$OPENSHIP_TMP/deploy.json" | jq -r '.data.deployment_id // .data.deployment.id // .deploymentId // .id // .data.id // .deployment.id // empty')"
  [[ -n "$deployment" ]] || die "deploy request returned no deployment id"
  echo "  deployment: $deployment"
  while (( SECONDS < deadline )); do
    status="$(api GET "/deployments/$deployment" | jq -r '.status // .data.status // .deployment.status // empty' || true)"
    case "$status" in
      ready) break ;;
      failed|cancelled) api GET "/deployments/$deployment/logs?tail=80" || true; die "deployment $deployment is $status" ;;
    esac
    sleep 10
  done
  [[ "$status" == ready ]] || die "deployment $deployment did not become ready (last status: ${status:-unknown})"

  say "Runtime checks"
  container_running "$TARGET_APP" || die "$TARGET_APP is not running; check the OpenShip container names"
  container_running "$TARGET_PG" || die "$TARGET_PG is not running; check the OpenShip container names"
  local missing
  missing="$(comm -23 <( { legacy_env_names; printf '%s\n' DATABASE_URL REDIS_URL NODE_EXTRA_CA_CERTS; } | sort -u) \
    <(docker inspect --type container --format '{{range .Config.Env}}{{println .}}{{end}}' "$TARGET_APP" | cut -d= -f1 | sort -u))"
  [[ -z "$missing" ]] || die "env names missing inside $TARGET_APP: $(echo "$missing" | tr '\n' ' ')"
  curl -fsS --max-time 10 "$STAGING_URL/game/health" | jq -e --arg sha "$SOURCE_SHA" '.ok == true and .proof == true and .revision == $sha' >/dev/null || die "$STAGING_URL/game/health is not ok at revision $SOURCE_SHA"
  echo "  $STAGING_URL/game/health ok, proof ready"
  write_marker "$STATE" "project_id=$id" "deployed_sha=$SOURCE_SHA" "deployment=$deployment" "phase=$( [[ -f "$STATE" ]] && marker_value "$STATE" phase || echo deployed)"
}

cutover() {
  [[ -f "$BACKUP_DIR/verify-passed.env" ]] || die "run verify first"
  [[ "$(marker_value "$BACKUP_DIR/verify-passed.env" status)" == passed ]] || die "verify did not pass"
  if container_running "$LEGACY_APP"; then die "$LEGACY_APP is running again; it would hold port 4317 and write to the old database"; fi
  write_marker "$STATE" "project_id=$(marker_value "$STATE" project_id)" "deployed_sha=$(marker_value "$STATE" deployed_sha)" "deployment=$(marker_value "$STATE" deployment)" "phase=cutover"
  STAGING_URL=http://127.0.0.1:4317 deploy
  say "Cutover done. The Academy is served by OpenShip on :4317."
}

case "${1:-}" in
  plan) plan ;;
  deploy) deploy ;;
  migrate-data) bash "$KIT_DIR/migrate-data.sh" ;;
  verify) bash "$KIT_DIR/verify.sh" ;;
  cutover) cutover ;;
  decommission)
    [[ -f "$STATE" && "$(marker_value "$STATE" phase)" == cutover ]] || die "decommission runs only after cutover"
    bash "$KIT_DIR/decommission.sh" --execute ;;
  *) die "usage: step.sh plan|deploy|migrate-data|verify|cutover|decommission" ;;
esac
