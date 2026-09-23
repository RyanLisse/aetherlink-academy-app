#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
patch_file="$script_dir/../chat-auth.patch"
source_dir="${CHAT_TEMPLATE_DIR:-/tmp/agent-native-upstream-chat-20260922/templates/chat}"

if [[ ! -f "$source_dir/server/plugins/auth.ts" ]]; then
  echo "Chat template is missing server/plugins/auth.ts: $source_dir" >&2
  exit 2
fi

work_dir="$(mktemp -d /tmp/academy-chat-auth-patch.XXXXXX)"
trap 'rm -rf "$work_dir"' EXIT
COPYFILE_DISABLE=1 cp -a "$source_dir/." "$work_dir/"

git -C "$work_dir" init -q
git -C "$work_dir" add server/plugins/auth.ts
git -C "$work_dir" -c user.name=verification -c user.email=verification@example.invalid commit -qm baseline
git -C "$work_dir" apply --check "$patch_file"
git -C "$work_dir" apply "$patch_file"

node - "$work_dir/server/plugins/auth.ts" "$work_dir/server/routes/_academy/embed/ticket.post.ts" <<'NODE'
const fs = require("node:fs");

const [authPath, routePath] = process.argv.slice(2);
const auth = fs.readFileSync(authPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");
const publicPaths = auth.match(/publicPaths:\s*\[([^\]]*)\]/)?.[1]?.trim();
if (publicPaths !== '"/_academy/embed/ticket"') {
  throw new Error(`Unexpected public paths: ${publicPaths ?? "missing"}`);
}
for (const required of [
  'readRawBody(event, false)',
  'x-academy-signature',
  'createHmac("sha256"',
  'createEmbedSessionTicket({',
  'consumeNonce(claims.nonce, claims.expiresAt)',
  'academy_embed_assertion_nonces',
  'targetPath: PATH',
  'return { startUrl: buildEmbedStartPath(ticket.ticket) }',
  'claims.targetPath === PATH',
]) {
  if (!route.includes(required)) throw new Error(`Missing route guard: ${required}`);
}
for (const forbidden of ["participantName", "Authorization", "Bearer ", "claims.name", "claims.email"]) {
  if (route.includes(forbidden)) throw new Error(`Forbidden participant credential surface: ${forbidden}`);
}
console.log("Chat auth patch applies cleanly and contains only the signed Academy embed route.");
NODE
