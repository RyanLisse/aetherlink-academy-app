# Runbook: one Academy, deployed through OpenShip

Status: prepared 2026-09-26. Nothing in this runbook has been run against the host.

Decision (Ryan, 2026-09-26): "there should only be 1 academy deployed, we should remove all
others and only have a deployed version thru openship". Data moves by `pg_dump` and restore
into Postgres run by OpenShip. The old containers and volumes are deleted right after
verification, and the dump is kept as the backup. `apps/server` (the academy-wave stack) is
dropped for now.

What changes for participants: one maintenance window, from `migrate-data` to `cutover`, in
which `http://91.99.78.17:4317` is down. Plan it outside a live session. Open browser tabs
reconnect afterwards. Sessions, rooms, Proof documents and progress carry over because they live
in Postgres. Presence dots reset because Redis starts empty.

What changes for the next operator: the Academy is the OpenShip project `aetherlink-academy`
(app, postgres, redis). Deploys happen only through the manual workflow
**Academy on OpenShip (manual)** (`.github/workflows/openship-academy.yml`). A merge to `main` no
longer deploys anything once the cutover patch is merged.

Background and sources: `infra/openship/RESEARCH.md`.

## What Ryan provides

1. **`OPENSHIP_TOKEN`**, a new repository secret. Create it in the OpenShip dashboard
   (Settings, Tokens) or with the CLI, logged in as an OpenShip admin:

   ```sh
   openship token create academy-github-actions --grant 'project:*:create' --expires 30
   ```

   The one grant needed is `project:*:create`. It lets the token create a project and list the
   projects it created, and on create OpenShip records `read,write,admin` on that new project
   for the token (`apps/api/src/modules/projects/project.controller.ts`). Deployment routes
   check write on the owning project, so no separate `deployment` grant is needed. No
   `--read-only`, because `deploy` writes. The kit finds the project by listing, and a
   restricted token only lists what it created, so let the kit create `aetherlink-academy`
   (`plan` reports it absent today). Do not create it from the dashboard. No `settings`, `server`,
   `terminal`, `domain` or organisation-level grants are needed. Rotate it after the decommission step.
   Paste it into GitHub (Settings, Secrets and variables, Actions, `OPENSHIP_TOKEN`). The kit
   refuses any value that does not start with `opsh_pat_`.
2. The existing secrets `ACADEMY_HETZNER_HOST`, `ACADEMY_HETZNER_USER` and
   `ACADEMY_HETZNER_SSH_KEY` stay as they are.
3. `jq` on the host (`apt-get install -y jq`) if `plan` reports it missing.
4. A maintenance window for `migrate-data` through `cutover`.

Nobody ever pastes a secret value into a workflow input, an issue or a chat. The kit copies the
app's secrets from `/root/aetherlink-academy/.env` on the host into OpenShip project env and
prints names only.

## Order

Run each step from GitHub, Actions, **Academy on OpenShip (manual)**, Run workflow, on `main`.
`sha` defaults to the workflow commit. Destructive steps need the phrase
`academy-openship-<step>` in `confirm`.

| # | Step | Confirm phrase | Downtime | Undo |
| --- | --- | --- | --- | --- |
| 1 | `plan` | none | none | nothing to undo, read-only |
| 2 | `deploy` | none | none | delete the OpenShip project |
| 3 | merge the cutover patch PR | n/a | none | revert the PR |
| 4 | `migrate-data` | `academy-openship-migrate-data` | starts | `docker start academy-app` |
| 5 | `verify` | none | continues | same as 4 |
| 6 | `cutover` | `academy-openship-cutover` | ends | see below |
| 7 | `decommission` | `academy-openship-decommission` | none | restore from the kept dump |

### 1. plan

Read-only. Prints host tools, the academy and openship containers, listeners on
80/443/4000/4317/4318/4327, legacy health, legacy database size, free backup disk, the env
names `deploy` would copy, whether the OpenShip project exists, and what each step would do.
Check that the disk has at least three times the database size free.

### 2. deploy

Creates the project from `infra/openship/academy.project.json` (services project,
`composePath: infra/openship/academy.compose.yaml`, readiness gate on `/game/health`), turns
auto-deploy off, generates Postgres and Redis passwords into
`/root/aetherlink-academy-openship/secrets.env` (0600) and TLS material into
`/root/aetherlink-academy-openship/tls`, copies the legacy env, and deploys the commit.
Compose services (app, postgres, redis) are persisted by OpenShip from `composePath` at
deploy-request time — the kit does not call `POST /services/sync` (that endpoint 404s for a
`project:*:create` PAT; see `infra/openship/RESEARCH.md`). The new Academy answers on
`127.0.0.1:4327` only, with an empty database. Legacy keeps serving 4317.

The step fails if the deployment does not reach `ready`, if an expected env name is missing in
the app container, or if `http://127.0.0.1:4327/game/health` is not ok at the deployed revision.

Undo: in OpenShip, delete project `aetherlink-academy` with volumes. Legacy is untouched.

### 3. Merge the cutover patch

`infra/openship/cutover/disable-legacy-deploys.patch` deletes `deploy-hetzner.yml` and
`wave-foundation-deploy.yml` and marks `docs/runbooks/apps-server-deploy.md` superseded.
Apply it on a branch (`git apply infra/openship/cutover/disable-legacy-deploys.patch`),
open a PR, and merge it **before** `migrate-data`. Otherwise the next merge to `main` would
restart `academy-app` on 4317 against the old database. `migrate-data`, `cutover` and
`decommission` refuse to run while either workflow still exists on `main`.

### 4. migrate-data (maintenance starts)

1. Stops `academy-app` and sets its restart policy to `no`, so nothing writes to the old
   database any more.
2. `pg_dump --format=custom` of the database named in the legacy `DATABASE_URL` to
   `/root/aetherlink-academy-backups/<UTC timestamp>.dump` (0600), checked with
   `pg_restore --list`. `/root/aetherlink-academy/data` is archived next to it.
3. Stops the OpenShip app, empties the target database, and restores the dump in one
   transaction.
4. Compares per-table row counts of every non-system table, old against new, and exits
   non-zero on any difference (the OpenShip app then stays stopped).
5. Copies `/data` into the new app, starts it, and writes `migrate-done.env`.

Undo: `docker update --restart=unless-stopped academy-app && docker start academy-app` on the
host. The old database was only read, so legacy is back exactly as it was.

### 5. verify

Against `127.0.0.1:4327`: row counts equal to the dump, `/game/health` ok with Proof ready at
the deployed revision, `/game/config` answers, a join with an unknown room code reaches the
database and returns `404 Kamercode niet gevonden.`, and `academy-app` is not running. With
`VERIFY_ROOM_CODE` set on the host it also joins a real room as `OpenShip verify`; that writes a
participant, so it runs last. On success it writes
`/root/aetherlink-academy-backups/verify-passed.env` with the dump path, its sha256 and the
counts. `cutover` and `decommission` require that marker.

Undo: as step 4.

### 6. cutover (maintenance ends)

Refuses unless verify passed and `academy-app` is stopped. Sets `ACADEMY_PORT_BIND=0.0.0.0:4317`,
redeploys, and checks health on `127.0.0.1:4317`. `ACADEMY_PUBLIC_URL` keeps the legacy value,
so links and the Proof WebSocket origin do not change. Afterwards run `verify` once more: after
cutover it accepts row counts that grew, never shrank.

Undo: from here on the new database takes writes. To go back, stop the OpenShip app, dump
`openship-academy-postgres`, restore that into `academy-postgres`, then start
`academy-app`. Without that, writes made after cutover are lost.

The domain `academy.aetherlink.ai` is a separate follow-up (AET-42). Once its A record points
at the host, add the domain to the project in OpenShip, which issues a Let's Encrypt
certificate through `openship-edge` on 80/443, raise `proxy_read_timeout` for the Proof
WebSocket, and change `ACADEMY_PUBLIC_URL` plus the Google OAuth redirect in one deploy.

### 7. decommission

Prints what it removes, then removes it: containers `academy-app`, `academy-postgres`,
`academy-redis` and every `academy-wave-*`; their Docker volumes and the `academy-wave` compose
volumes and network; the directory `/root/aetherlink-academy-wave`. It refuses when the verify
marker is missing, when the dump no longer matches the recorded sha256, before cutover, or when
a volume is still used by a container outside that list. It keeps the dump, the data archive
and `/root/aetherlink-academy` (legacy `.env`, `tls`, `data`), which hold the only copy of the
legacy configuration. Remove that directory by hand once the new Academy has run a live session.

To preview on the host without removing anything:
`bash /root/aetherlink-academy-openship/src/infra/openship/decommission.sh` (dry run is the default).

Undo: none for the containers. The data is in the kept dump. Restore it with
`pg_restore --no-owner --no-privileges` into a fresh Postgres 16.

## Open before running

- The items marked unverified in `infra/openship/RESEARCH.md`: the `../..` build context from
  `infra/openship/`, project env reaching compose interpolation, readiness on a services project,
  a public repository deploying without a GitHub App installation, and the Proof WebSocket under
  the edge's 60 s read timeout.
- Container names `openship-academy-app` and `openship-academy-postgres`
  follow the naming in the source. If `deploy` reports another name, set `TARGET_APP_CONTAINER`
  and `TARGET_PG_CONTAINER` on the host.
