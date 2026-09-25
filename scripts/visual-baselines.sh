#!/usr/bin/env bash
# Regenerate (or check) the legacy visual baselines inside the same Playwright
# image CI uses, so fonts and rasterisation match byte for byte.
#   bash scripts/visual-baselines.sh          # rewrite tests/visual/__screenshots__
#   bash scripts/visual-baselines.sh --check  # compare only, like CI
set -euo pipefail
IMAGE=mcr.microsoft.com/playwright:v1.63.0-noble
ROOT=$(cd "$(dirname "$0")/.." && pwd)
MODE=--update-snapshots
[[ "${1:-}" == --check ]] && MODE=

mkdir -p "$ROOT/tests/visual/__screenshots__"
git -C "$ROOT" ls-files -z --cached --others --exclude-standard | COPYFILE_DISABLE=1 tar -C "$ROOT" --null -T - -cf - |
docker run --rm -i --platform linux/amd64 --ipc=host \
  -v "$ROOT/tests/visual/__screenshots__":/src-shots \
  -e CI=1 "$IMAGE" bash -euo pipefail -c "
    mkdir -p /work && tar -C /work -xf - && cd /work && corepack enable >/dev/null && corepack prepare pnpm@11.19.0 --activate >/dev/null
    pnpm install --frozen-lockfile >/dev/null
    pnpm run build:legacy >/dev/null
    pnpm run test:visual:legacy $MODE
    [[ -n '$MODE' ]] && cp tests/visual/__screenshots__/*.png /src-shots/ || true
  "
