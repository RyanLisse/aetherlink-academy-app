#!/usr/bin/env bash
# Operator-invoked sibling deploy of the wave foundation stack. Mirrors the
# /root/aetherlink-academy/rebuild-from-git.sh pattern but only ever touches the
# academy-wave compose project. Never run automatically on push.
#
# usage: rebuild-wave-foundation.sh <full-git-sha>
# env:   ACADEMY_WAVE_HOME (default /root/aetherlink-academy-wave)
#        ACADEMY_WAVE_REPO (default https://github.com/RyanLisse/aetherlink-academy-app.git)
set -Eeuo pipefail

sha="${1:-}"
if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'usage: %s <full 40-char git sha>\n' "$0" >&2
  exit 2
fi

wave_home="${ACADEMY_WAVE_HOME:-/root/aetherlink-academy-wave}"
repo="${ACADEMY_WAVE_REPO:-https://github.com/RyanLisse/aetherlink-academy-app.git}"
src="$wave_home/src"
env_file="$wave_home/.env"

mkdir -p "$wave_home"

if [[ ! -f "$env_file" ]]; then
  printf 'missing %s (copy infra/.env.example and fill in real values)\n' "$env_file" >&2
  exit 3
fi

if [[ ! -d "$src/.git" ]]; then
  git clone --recurse-submodules "$repo" "$src"
fi
git -C "$src" fetch --all --tags --prune
git -C "$src" checkout --detach "$sha"
git -C "$src" submodule update --init --recursive

cp "$env_file" "$src/infra/.env"
chmod 600 "$src/infra/.env"

export SOURCE_REVISION="$sha"
compose=(docker compose --project-name academy-wave --file "$src/infra/compose.yaml" --env-file "$src/infra/.env")
"${compose[@]}" build --pull app
"${compose[@]}" up --detach --remove-orphans

for _ in $(seq 1 60); do
  body="$(curl --silent --fail http://127.0.0.1:4318/health || true)"
  if [[ "$body" == *'"ok":true'* && "$body" == *"\"revision\":\"$sha\""* ]]; then
    printf 'wave foundation healthy at :4318 for %s\n' "$sha"
    if ! curl --silent --fail http://127.0.0.1:4317/game/health >/dev/null; then
      printf 'legacy app did not answer at :4317\n' >&2
      exit 1
    fi
    printf 'legacy app still answering at :4317\n'
    exit 0
  fi
  sleep 2
done
printf 'wave foundation did not become healthy; last body: %s\n' "$body" >&2
"${compose[@]}" logs --tail 100 app >&2
exit 1
