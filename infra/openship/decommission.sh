#!/usr/bin/env bash
# Removes the legacy Academy containers, their volumes and the academy-wave
# checkout once verify.sh has recorded a passing verification. The pg_dump
# named in the verify marker is kept. Dry run unless --execute is given.
set -Eeuo pipefail

# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
WAVE_DIR="${ACADEMY_WAVE_DIR:-/root/aetherlink-academy-wave}"
MARKER="$BACKUP_DIR/verify-passed.env"
LEGACY_CONTAINERS=(academy-app academy-postgres academy-redis)

mode=dry-run
case "${1:-}" in
  "" | --dry-run) ;;
  --execute) mode=execute ;;
  *) echo "usage: decommission.sh [--dry-run|--execute]" >&2; exit 2 ;;
esac

[[ -f "$MARKER" ]] || die "no verify marker at $MARKER; run the verify step first"
[[ "$(marker_value "$MARKER" status)" == "passed" ]] || die "verify marker does not say status=passed"
dump="$(marker_value "$MARKER" dump)"
[[ -n "$dump" && -f "$dump" ]] || die "dump named in the verify marker is missing: ${dump:-<empty>}"
[[ "$(sha256 "$dump")" == "$(marker_value "$MARKER" dump_sha256)" ]] || die "dump checksum does not match the verify marker"

containers=()
for name in "${LEGACY_CONTAINERS[@]}"; do
  if docker inspect --type container "$name" >/dev/null 2>&1; then containers+=("$name"); fi
done
while IFS= read -r name; do
  [[ -n "$name" ]] && containers+=("$name")
done < <(docker ps -a --filter 'name=^academy-wave-' --format '{{.Names}}' | sort)

for name in "${containers[@]+"${containers[@]}"}"; do
  [[ "$name" =~ ^academy-(app|postgres|redis)$ || "$name" =~ ^academy-wave- ]] || die "refusing unexpected container name $name"
done

volumes=()
add_volume() {
  local candidate="$1" existing
  [[ -z "$candidate" ]] && return
  for existing in "${volumes[@]+"${volumes[@]}"}"; do [[ "$existing" == "$candidate" ]] && return; done
  volumes+=("$candidate")
}
for name in "${containers[@]+"${containers[@]}"}"; do
  while IFS= read -r volume; do add_volume "$volume"; done < <(docker inspect --type container --format '{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}{{"\n"}}{{end}}{{end}}' "$name")
done
while IFS= read -r volume; do add_volume "$volume"; done < <(docker volume ls -q --filter label=com.docker.compose.project=academy-wave)

for volume in "${volumes[@]+"${volumes[@]}"}"; do
  while IFS= read -r user; do
    [[ -z "$user" ]] && continue
    keep=true
    for name in "${containers[@]+"${containers[@]}"}"; do [[ "$user" == "$name" ]] && keep=false; done
    [[ "$keep" == false ]] || die "volume $volume is also used by $user, which is not being removed"
  done < <(docker ps -a --filter "volume=$volume" --format '{{.Names}}')
done

networks=()
while IFS= read -r network; do [[ -n "$network" ]] && networks+=("$network"); done < <(docker network ls --filter label=com.docker.compose.project=academy-wave --format '{{.Name}}')

echo "Verified dump kept: $dump"
echo "Containers to stop and remove:"
for name in "${containers[@]+"${containers[@]}"}"; do echo "  $name"; done
echo "Volumes to remove:"
for volume in "${volumes[@]+"${volumes[@]}"}"; do echo "  $volume"; done
echo "Networks to remove:"
for network in "${networks[@]+"${networks[@]}"}"; do echo "  $network"; done
echo "Directory to remove:"
if [[ -d "$WAVE_DIR" ]]; then echo "  $WAVE_DIR"; fi

if [[ "$mode" != execute ]]; then
  echo "Dry run. Nothing was removed. Re-run with --execute to apply."
  exit 0
fi

for name in "${containers[@]+"${containers[@]}"}"; do
  docker stop "$name" >/dev/null
  docker rm "$name" >/dev/null
done
for volume in "${volumes[@]+"${volumes[@]}"}"; do docker volume rm "$volume" >/dev/null; done
for network in "${networks[@]+"${networks[@]}"}"; do docker network rm "$network" >/dev/null; done
if [[ -d "$WAVE_DIR" ]]; then rm -rf -- "$WAVE_DIR"; fi
echo "Decommissioned. Kept $dump"
