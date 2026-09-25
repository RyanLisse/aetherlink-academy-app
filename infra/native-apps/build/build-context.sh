#!/usr/bin/env bash
set -euo pipefail

# Copy one generated standalone scaffold into a clean upload/build context.
# The source checkout and lockfile are read only; OUTPUT_DIR must be new. The
# checked-in patch then adds the signed Academy embed ticket boundary without
# modifying the upstream scaffold checkout.

app="${APP:-chat}"
source_dir="${UPSTREAM_SOURCE_DIR:-/tmp/academy-chat-service}"
output_dir="${OUTPUT_DIR:-}"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$app" != "chat" ]]; then
  echo "This standalone context recipe currently supports APP=chat only" >&2
  exit 2
fi
if [[ -z "$output_dir" ]]; then
  echo "OUTPUT_DIR is required (use a new temporary directory)" >&2
  exit 2
fi
if [[ ! -d "$source_dir" || ! -f "$source_dir/package.json" || ! -s "$source_dir/pnpm-lock.yaml" ]]; then
  echo "Standalone source or generated lockfile is missing: $source_dir" >&2
  exit 2
fi
if ! node - "$source_dir/package.json" <<'NODE'
const fs = require("node:fs");
const packageFile = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
const scaffold = pkg["agent-native"]?.scaffold;
const checks = [
  [pkg.name === "academy-chat-service", "package name academy-chat-service"],
  [scaffold?.template === "chat", "standalone chat template metadata"],
  [scaffold?.shape === "standalone", "standalone scaffold shape metadata"],
  [scaffold?.templateSource === "bundled", "bundled template source metadata"],
  [scaffold?.templateRef === "@agent-native/core@0.182.1", "core 0.182.1 template reference"],
  [scaffold?.coreVersion === "0.182.1", "core 0.182.1 version metadata"],
];
const failed = checks.filter(([, ok]) => !ok).map(([, label]) => label);
if (failed.length) {
  console.error(`Invalid standalone Chat scaffold metadata: ${failed.join(", ")}`);
  process.exit(1);
}
NODE
then
  exit 2
fi
if [[ -e "$output_dir" ]]; then
  echo "OUTPUT_DIR already exists; choose a new directory: $output_dir" >&2
  exit 2
fi

mkdir -p "$output_dir"
COPYFILE_DISABLE=1 rsync -a \
  --exclude .git \
  --exclude .agents \
  --exclude .claude \
  --exclude .codex \
  --exclude node_modules \
  --exclude '**/node_modules/**' \
  --exclude '.env*' \
  --exclude '**/.env*' \
  --exclude '.output' \
  --exclude '**/.output' \
  --exclude 'dist' \
  --exclude '**/dist' \
  --exclude 'coverage' \
  --exclude '**/coverage' \
  --exclude '*.log' \
  --exclude '**/*.log' \
  --exclude '.DS_Store' \
  "$source_dir/" "$output_dir/"
cp "$script_dir/Dockerfile" "$output_dir/Dockerfile"
cp "$script_dir/.dockerignore" "$output_dir/.dockerignore"
cp "$script_dir/chat-auth.patch" "$output_dir/chat-auth.patch"
if source_status="$(git -C "$source_dir" status --porcelain --untracked-files=normal 2>/dev/null)" && [[ -z "$source_status" ]]; then
  source_git_state=clean
else
  source_git_state=dirty
fi
printf 'context=%s\napp=%s\nsource=%s\nsource_git_state=%s\n' "$output_dir" "$app" "$source_dir" "$source_git_state"
