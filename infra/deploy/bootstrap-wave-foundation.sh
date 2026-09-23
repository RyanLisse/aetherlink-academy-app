#!/usr/bin/env bash
# First-time (or repair) host bootstrap for the AET-20 sibling stack.
# Safe to re-run. Generates /root/aetherlink-academy-wave/.env only when missing.
# Never prints secret values.
#
# usage: bootstrap-wave-foundation.sh <full-git-sha>
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

if [[ ! -d "$src/.git" ]]; then
  git clone --recurse-submodules "$repo" "$src"
fi
git -C "$src" fetch --all --tags --prune
git -C "$src" checkout --detach "$sha"
git -C "$src" submodule update --init --recursive

install -m 0755 "$src/infra/deploy/rebuild-wave-foundation.sh" "$wave_home/rebuild-wave-foundation.sh"
install -m 0755 "$src/infra/deploy/bootstrap-wave-foundation.sh" "$wave_home/bootstrap-wave-foundation.sh"

if [[ ! -f "$env_file" ]]; then
  # Passwords: >=20 chars, only [A-Za-z0-9_-] per infra/deploy/README.md
  pg="$(openssl rand -hex 32)"
  rd="$(openssl rand -hex 32)"
  sig="$(openssl rand -hex 32)"
  umask 077
  cat >"$env_file" <<ENV
POSTGRES_PASSWORD=${pg}
REDIS_PASSWORD=${rd}
PROOF_COLLAB_SIGNING_SECRET=${sig}
ACADEMY_PUBLIC_URL=http://127.0.0.1:4318
PROOF_DATABASE_SCHEMA=proof_wave
PROOF_REDIS_PREFIX=proof-wave
SOURCE_REVISION=${sha}
ENV
  chmod 600 "$env_file"
  printf 'bootstrapped %s (secrets generated on host; not printed)\n' "$env_file"
else
  printf 'reusing existing %s\n' "$env_file"
fi

printf 'bootstrap ready at %s for %s\n' "$wave_home" "$sha"
