# Runbook: deploy apps/server next to the legacy gateway

Status: prepared 2026-09-26. Nothing in this runbook has been run against production yet.

For: the operator who puts `apps/server` (Effect + Drizzle, AET-45 to AET-55, AET-25) on the Hetzner host `aetherlink-academy` (91.99.78.17) for the first time.

## 1. What runs where

| Process | Port | Reachable from | Deployed by |
| --- | --- | --- | --- |
| Legacy gateway `academy-app` (`server/app.mjs`) | 4317 | public today (http://91.99.78.17:4317) | push to `main`, workflow **Deploy Hetzner Academy** |
| Legacy Proof | 4400 | loopback | same container |
| `apps/server` (Compose project `academy-wave`, service `app`) | 4318 | loopback only (`127.0.0.1:4318`) | manual workflow **Wave foundation sibling deploy (manual)** |
| Wave Proof (service `proof`) | 4418 | Compose network only | same workflow |
| Wave Postgres 16 and Redis 7 (TLS) | none published | Compose network only | same workflow |
| OpenShip edge | 80, 443 | public | OpenShip |

The two stacks share nothing. `academy-wave` has its own Postgres, Redis, Proof, volumes and network (`infra/compose.yaml`). The legacy gateway does not proxy to apps/server; there is no shared path. apps/server also serves the apps/web SPA from `ACADEMY_WEB_DIST`, so it is a complete origin on its own.

To reach apps/server from a browser you need a separate HTTPS hostname on the OpenShip edge that points at `127.0.0.1:4318` (see step 7). Google OAuth needs that hostname too: Google refuses raw IPs and plain HTTP for non-localhost redirect URIs.

## 2. What must exist first

1. GitHub secrets `ACADEMY_HETZNER_HOST`, `ACADEMY_HETZNER_USER`, `ACADEMY_HETZNER_SSH_KEY`. They already exist; the legacy deploy uses them.
2. Enough disk on the host. `infra/native-apps/CAPACITY.md` recorded 15 GB free on 2026-09-21. The wave image builds apps/server, apps/web and Proof in one image. Check first:

   ```sh
   ssh root@91.99.78.17 'df -h / && docker system df'
   ```

3. Postgres, Redis and Proof: nothing to buy or create. The Compose stack starts its own. `bootstrap-wave-foundation.sh` writes `/root/aetherlink-academy-wave/.env` with random passwords the first time.
4. For Google login on apps/server only: a public HTTPS hostname (step 7) and a Google OAuth client ([google-oauth.md](google-oauth.md)).

## 3. Environment variables for apps/server

Names come from `apps/server/src/layers/config.ts`, `src/identity/google-sso.ts`, `src/identity/facilitator-auth.ts` and `src/authoring/config.ts`.

| Variable | Required | Default | In the Compose deploy |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | none | set by `infra/compose.yaml` from `POSTGRES_PASSWORD` |
| `REDIS_URL` (or `KV_URL`) | yes | none | set by Compose from `REDIS_PASSWORD` |
| `HOST` | no | `127.0.0.1` | `0.0.0.0` inside the container |
| `PORT` | no | `4318` | `4318` |
| `ACADEMY_PUBLIC_URL` | no | `http://127.0.0.1:<PORT>` | `.env`. Set it to the HTTPS hostname before enabling Google. It builds the Google callback and decides the `Secure` cookie flag |
| `SOURCE_REVISION` | no | none (`/health` shows `null`) | set by the rebuild script to the deployed SHA |
| `ACADEMY_WEB_DIST` | no | none (no SPA served) | `/app/apps/web/dist` |
| `PROOF_URL` | no | unset, so apps/server spawns Proof itself | `http://proof:4418` (separate `proof` service) |
| `PROOF_PORT` | no | `4418` | image default |
| `PROOF_SDK_DIR` | no | `vendor/proof-sdk` | image default |
| `PROOF_COLLAB_SIGNING_SECRET` | yes in practice | none | `.env`, random 64 hex characters |
| `PROOF_DATABASE_SCHEMA` | no | `proof_wave` | `.env` |
| `PROOF_REDIS_PREFIX` | no | `proof-wave` | `.env` |
| `NODE_EXTRA_CA_CERTS` | no | none | `/tls/ca.crt` (the stack's own CA) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ACADEMY_FACILITATOR_DOMAINS` | all three or none | SSO off | add to `.env`. If only one or two are set, apps/server refuses to boot |
| `ACADEMY_AUTHORING_ENABLED` (`true`), `ACADEMY_AUTHORING_KEY`, `ACADEMY_AUTHORING_DATA_DIR`, `AGENT_SLIDES_URL` (https), `AGENT_SLIDES_TOKEN` | all or the authoring API stays off | off | leave out unless you want the authoring PoC routes |
| `ACADEMY_AUTHORING_UPSTREAM_TIMEOUT_MS` | no | `15000` | leave out |

The server itself does not read `ACADEMY_URL`, `ACADEMY_TOKEN`, `ACADEMY_LIVE_HOST` or `ACADEMY_LIVE_PORT`. They belong to the MCP stdio client and the standalone live dev servers.

The host file `/root/aetherlink-academy-wave/.env` is the only place to edit values. The rebuild script copies it into the checkout on every run. Compose passes the whole file to both `app` and `proof`.

## 4. First deploy (sibling Compose)

1. Pick the SHA. Use the tip of `main` unless you have a reason not to:

   ```sh
   SHA=$(gh api repos/RyanLisse/aetherlink-academy-app/commits/main --jq .sha); echo "$SHA"
   ```

2. Start the manual workflow. It bootstraps the host the first time, builds `infra/Dockerfile`, runs `compose up`, waits until `/health` reports `ok`, `proof` and the SHA, and checks that `:4317/game/health` still answers:

   ```sh
   gh workflow run wave-foundation-deploy.yml --repo RyanLisse/aetherlink-academy-app --ref main -f sha="$SHA" -f confirm=deploy-sibling
   gh run watch --repo RyanLisse/aetherlink-academy-app "$(gh run list --repo RyanLisse/aetherlink-academy-app --workflow wave-foundation-deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
   ```

   Without GitHub, run the same thing on the host:

   ```sh
   git clone https://github.com/RyanLisse/aetherlink-academy-app.git /tmp/academy-wave-bootstrap
   bash /tmp/academy-wave-bootstrap/infra/deploy/bootstrap-wave-foundation.sh "$SHA"
   /root/aetherlink-academy-wave/rebuild-wave-foundation.sh "$SHA"
   ```

Done when the workflow log ends with `wave foundation healthy at :4318 for <SHA>` and `legacy app still answering at :4317`.

## 5. Apply the Drizzle migrations (0000 to 0006)

apps/server never runs migrations at start. Run them once after the first deploy and again after any deploy that adds a file under `apps/server/drizzle/`. The migrator is idempotent: a second run applies nothing. Tested on 2026-09-26 against a clean `postgres:16`; the first run applied 7, the second run applied 0.

On the host, as root:

```sh
W=/root/aetherlink-academy-wave
dc() { docker compose --project-name academy-wave --file "$W/src/infra/compose.yaml" --env-file "$W/src/infra/.env" "$@"; }
dc exec -T -w /app/apps/server app node --input-type=module <<'JS'
import {NodeChildProcessSpawner, NodeFileSystem, NodePath} from '@effect/platform-node';
import {PgClient} from '@effect/sql-pg';
import {Effect, Layer, Redacted} from 'effect';
import {run} from './dist/db/migrate.js';
const url = new URL(process.env.DATABASE_URL);
const ssl = (url.searchParams.get('sslmode') ?? 'disable') !== 'disable';
url.searchParams.delete('sslmode');
const platform = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
const layer = Layer.mergeAll(PgClient.layer({url: Redacted.make(url.href), ssl}), platform, NodeChildProcessSpawner.layer.pipe(Layer.provide(platform)));
const applied = await Effect.runPromise(run.pipe(Effect.provide(layer)));
console.log('applied now:', applied.map(([id, name]) => `${id}_${name}`).join(', ') || 'none (already up to date)');
JS
```

The migrator records file `NNNN_name.sql` as id `NNNN+1` in `public.academy_curriculum_migrations`, so 0000 to 0006 become ids 1 to 7.

Check it:

```sh
dc exec -T postgres psql -U academy -d academy -Atc "select migration_id, name from academy_curriculum_migrations order by 1"
```

Done when the query prints `1|dashing_pet_avengers` through `7|facilitator_sessions`. The first run prints `applied now: 1_dashing_pet_avengers, 2_immutability_triggers, 3_room_pin_invariants, 4_draft_content_hash, 5_search_tsvector, 6_authoring_authorship, 7_facilitator_sessions`.

## 6. Verify

From inside the app container, with the `dc` helper from step 5. The image contains `scripts/verify/` for any SHA that includes this runbook. `DATABASE_URL` is already in the container env, so the migration check runs too:

```sh
dc exec -T app node scripts/verify/apps-server.mjs http://127.0.0.1:4318 --revision "$SHA" --skip-google
```

Done when it ends with `all 6 checks passed`: `/health ok and proof`, `/health revision`, `/connection postgres`, `/connection redis`, `/connection proof`, `drizzle migrations applied (7 of 7, latest 7_facilitator_sessions)`.

After Google is configured (step 8), drop `--skip-google` and add `--public-url https://<apps-server-host>`.

## 7. Public hostname through the OpenShip edge (optional, needed for Google)

1. Choose a hostname, for example `academy-next.aetherlink.ai`. Add an `A` record for it to `91.99.78.17` in GoDaddy. Do not touch `@`, `www`, MX, SPF, DKIM or DMARC.
2. In OpenShip, attach the hostname and route it to `127.0.0.1:4318`. OpenShip owns ports 80 and 443; do not start a second proxy. Keep WebSocket upgrades and streaming responses on (Proof collaboration uses `/ws`).
3. Set `ACADEMY_PUBLIC_URL=https://academy-next.aetherlink.ai` in `/root/aetherlink-academy-wave/.env` and rerun the rebuild script with the same SHA.

Done when `curl -fsS https://academy-next.aetherlink.ai/health` returns `"ok":true,"proof":true` and the SHA.

Open: it is not verified from the repository whether the OpenShip edge can route a hostname to a container it does not manage. If it cannot, deploy apps/server as an OpenShip project instead. The authoring PoC did exactly that (`infra/poc/academy.Dockerfile`, `docs/poc-evidence/ACCEPTANCE.md`). That path needs its own Postgres and Redis URLs, the same env table as step 3, `PORT` set to the port OpenShip routes to, health check `GET /health`, and the step 5 migration run once against its `DATABASE_URL`.

## 8. Turn on Google login for apps/server

1. Add `https://<apps-server-host>/auth/google/callback` to the OAuth client (see [google-oauth.md](google-oauth.md)).
2. Add all three lines at once to `/root/aetherlink-academy-wave/.env`:

   ```sh
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ACADEMY_FACILITATOR_DOMAINS=aetherlink.ai
   ```

3. Check that migration 7 (`facilitator_sessions`) is present (step 5). Without it every login ends in `/?login_error=session`.
4. Rerun `/root/aetherlink-academy-wave/rebuild-wave-foundation.sh "$SHA"`.
5. Run step 6 without `--skip-google`.

## 9. Rollback

- Stop only the new stack. The legacy gateway keeps running:

  ```sh
  dc stop app proof
  ```

- Or redeploy an earlier SHA with the same workflow or `rebuild-wave-foundation.sh <older-sha>`.
- Migrations have no down step. 0000 to 0006 only add schemas, tables, triggers and indexes in the stack's own database, so an older apps/server keeps working with them. Do not drop tables by hand.
- Never run `down --volumes` on the host. It deletes the wave database and the generated TLS CA.
- The generated CA and service certificates are valid for 365 days (`infra/deploy/init-tls.sh`). Plan a renewal before September 2027.

## 10. Access so Claude can do the deploy next time

Least privilege first. Each line says what it unlocks.

1. Nothing new for deploys. Claude can dispatch **Wave foundation sibling deploy (manual)** with the GitHub CLI session it already uses for PRs. The SSH key stays a GitHub secret and never reaches Claude. Recommended hardening: move the three `ACADEMY_HETZNER_*` secrets into a GitHub Environment (for example `hetzner`) with Ryan as required reviewer. Claude can then start a deploy and Ryan approves it with one click. This needs a one-line `environment:` change in both deploy workflows.
2. Migrations without SSH: add the step 5 command to `rebuild-wave-foundation.sh` (after `compose up`, before the health wait). Then the same workflow applies migrations and Claude needs no shell on the host. This is a small follow-up PR.
3. Only if Claude must inspect the host: a dedicated ed25519 key with a forced command in `/root/.ssh/authorized_keys`, for example `command="/root/aetherlink-academy-wave/ops.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... claude-academy-ops`. `ops.sh` would allow only `status`, `logs` and `verify`. Any key that can run `docker` is root on this host, so do not hand out a general shell key.
4. Secret values (Google client secret, SMTP password) stay with Ryan. Claude does not need to read them to deploy or verify.
5. OpenShip path only: a project-scoped OpenShip API token stored as a GitHub Environment secret (for example `OPENSHIP_TOKEN`), behind the same reviewer gate.
6. Not needed: a Hetzner Cloud API token, GoDaddy access or Google Cloud access.

## 11. Before state (2026-09-26)

```text
$ node scripts/verify/apps-server.mjs http://91.99.78.17:4318
apps/server on http://91.99.78.17:4318
  FAIL  /health ok and proof  (The operation was aborted due to timeout)
  FAIL  start redirects to Google  (The operation was aborted due to timeout)
2 of 2 checks failed
```

Expected: port 4318 is loopback-only by design, and whether `academy-wave` is running on the host was not checked (no SSH from this session). Also recorded: `http://91.99.78.17:4317/game/health` returned `{"ok":true,"proof":true,"revision":null}`. The legacy gateway reports no revision, so note the deployed SHA from the workflow run instead.
