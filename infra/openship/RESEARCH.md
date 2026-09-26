# OpenShip 0.7.2: what the Academy migration relies on

Retrieved 2026-09-26 from the source of `github.com/oblien/openship` at tag `v0.7.2`
(the version running on the Academy host). Links below point at that tag; `G` stands for
`https://github.com/oblien/openship/blob/v0.7.2`. No OpenShip server was contacted.
openship.io was not consulted for this file; where the source was silent the item is
marked **unverified** and the kit checks it at run time instead of assuming it.

## Access

- **CLI.** npm package `openship` 0.7.2, binary `openship`, Node 22 or newer
  (`G/apps/cli/package.json`). Install: `npm i -g openship@0.7.2`, or
  `curl -fsSL https://get.openship.io | OPENSHIP_VERSION=0.7.2 sh` (`G/scripts/install.sh`).
- **Login.** `openship login --token opsh_pat_... --api-url http://127.0.0.1:4000 --context NAME`
  (`G/apps/cli/src/commands/login.ts`). The CLI has no environment variable for the token or
  the API URL and stores both in `~/.openship/config.json` (`G/apps/cli/src/lib/config.ts`).
- **Decision.** The kit calls the REST API with `curl` instead of the CLI. The CLI would put
  the token (`login --token`) and env values (`project env set --set K=V`, `api -d`) in
  process arguments. The kit keeps the token in a 0600 header file (`curl -H @file`) and
  request bodies in 0600 files (`--data-binary @file`). The endpoints are the ones the CLI
  itself calls, with `Authorization: Bearer opsh_pat_...` and no `Origin` header
  (`G/apps/cli/src/lib/api-client.ts`).

| Operation | Endpoint (under `/api`) | Token grant |
| --- | --- | --- |
| List projects | `GET /projects` | `project` read (list) |
| Create project | `POST /projects` | `project:*` create |
| Turn off auto-deploy | `POST /projects/:id/auto-deploy {enabled:false}` | `project` write |
| Set env | `PATCH /projects/:id/env {environment, upserts[{key,value,isSecret}], deletes}` | `project` write |
| Deploy a commit | `POST /deployments {projectId, branch, commitSha, environment}` | project write **and** `github_repository:owner/repo:read` (scoped PAT) |
| List services | `GET /projects/:id/services` | `project` read (nested list) |
| Sync services | `POST /projects/:id/services/sync` | **unusable** with runbook PAT — see below |
| Status, logs | `GET /deployments/:id`, `GET /deployments/:id/logs?tail=` | `deployment` read |
| Rollback | `POST /deployments/:id/rollback` | `deployment` write |

Routes: `G/apps/api/src/modules/projects/project.routes.ts`, `.../deployments/deployment.routes.ts`,
`.../services/service.routes.ts`.
Bodies: `.../projects/project.schema.ts` (`CreateProjectBody`), `.../deployments/deployment.schema.ts`.
Deployment status values: `queued | building | deploying | ready | failed | cancelled`
(`G/packages/core/src/types.ts`).

`POST /projects/:id/services/sync` is tagged `project:service:write` with `collection: true`, which
asserts `{service,"*",write}` (`G/apps/api/src/lib/route-permission.ts`). A runbook PAT granted only
`project:*:create` cannot satisfy service `*`, so the call returns 404
`NotFoundError("service","*")`. The kit does **not** call that endpoint. OpenShip 0.7.2 already
persists compose services from the project's `composePath` at deploy-request time
(`G/apps/api/src/modules/deployments/build.service.ts` → `syncFromCompose`), which is enough for a
`projectType: services` project.

`POST /deployments` also calls `assertGitHubRepoAccess` on the project's `gitOwner`/`gitRepo`
(`G/apps/api/src/modules/github/github-access.ts`, from `build.service.ts`). Scoped PATs never get
the org-owner auto-allow — only an explicit `github_repository` (or `github_installation` /
`github`) grant with `read` (or stronger) passes. Without it the API returns 403
`GITHUB_ACCESS_DENIED`. That gate is **OpenShip authorization**, separate from GitHub App install /
clone credentials. A **public** GitHub repo clones anonymously (preflight skips App/clone-token
demands); the App (`installUrl` openship-io, `requiresCloud: true` on self-hosted) is not required
for Academy deploy.

## Tokens

`openship token create NAME (--grant type:id:perms | --full-access) [--read-only] [--expires 1-365]`
(`G/apps/cli/src/commands/token.ts`). Permissions are `read`, `write`, `admin`, `create`;
`create` only exists as `project:*:create` and means "projects this token creates"
(`G/apps/api/src/modules/tokens/token.schema.ts`). A PAT without grants is refused unless
`fullAccess` is explicit. `--read-only` blocks every non-GET request.

## Databases and other stateful services

- 0.7.2 has **no managed Postgres feature**. Stateful services are compose services in a
  `services` project, stored as rows in the `service` table (`G/packages/db/src/schema/service.ts`).
  Images are free-form, so `postgres:16` and `redis:7-alpine` run as-is. The app catalog only
  offers Valkey 8.1 for Redis and no plain Postgres (`G/packages/core/src/apps/catalog/`).
- A project whose create body has `composePath` becomes a compose/services deploy
  (`G/apps/api/src/modules/projects/project-crud.service.ts`). The compose directory anchors
  relative `build:` contexts (`G/apps/api/src/modules/deployments/prepare.service.ts`); the
  build refuses a context that escapes the repository (`G/packages/adapters/src/runtime/cloud.ts`).
  **Unverified:** that `context: ../..` from `infra/openship/` is accepted by the self-hosted
  Docker runtime. If `deploy` fails on it, move the compose file to the repository root.
- Containers are named `openship-<slug>-<service>` on a per-project bridge network
  `openship-<slug>`, with the service name as hostname (`G/packages/adapters/src/runtime/docker.ts`).
  That is why the kit's TLS certificates (SANs `postgres`, `redis`) keep working.
- Named volumes become `openship-<slug>-<name>`; bind mounts pass through unchanged
  (`G/packages/adapters/src/runtime/volume-namespace.ts`). The kit bind-mounts
  `/root/aetherlink-academy-openship/tls` read-only.
- No connection string is injected for a hand-made Postgres service. The compose file builds
  `DATABASE_URL` and `REDIS_URL` from `POSTGRES_PASSWORD` and `REDIS_PASSWORD`, which are
  project env vars. Compose interpolation from project env is how the parser is fed
  (`G/apps/api/src/lib/compose-parser.ts`, `ComposeParseOptions.env`). **Unverified:** that
  saved project env reaches that interpolation on a git deploy. `deploy` checks the env names
  inside the running app container and fails when any is missing.
- OpenShip can back up Postgres with `pg_dump -Fc` and restore with `pg_restore --clean`
  (`G/packages/adapters/src/backup/producers/pg-dump.ts`). The kit does its own dump so the
  backup exists before OpenShip touches anything.

## The Academy's own constraints

- The gateway requires TLS to Postgres (`ssl: {rejectUnauthorized: true}` in `server/storage.mjs`)
  and a `rediss://` URL (`server/presence.mjs`). The compose file therefore reuses
  `infra/deploy/init-tls.sh` and `NODE_EXTRA_CA_CERTS=/tls/ca.crt`, as `infra/compose.yaml` does.
- Postgres holds everything durable: schemas `academy` (`server/postgres-store.mjs`) and `proof`
  (`vendor/proof-sdk/server/db-postgres.ts`). The row-count check covers every non-system table.
- **Redis holds nothing durable.** Presence keys are set with `EX` (`server/presence.mjs`),
  screen-state hashes get `EXPIRE` (`server/screen-state.mjs`), and Proof uses Redis for
  Hocuspocus pub/sub and canonical-change messages only (`vendor/proof-sdk/server/shared-redis.ts`).
  The kit starts a fresh Redis. Open browser sessions reconnect and re-announce presence.
- `/data` holds Proof snapshots and fallback key files (`scripts/start.mjs`). `migrate-data`
  archives `/root/aetherlink-academy/data` and copies it into the new `data` volume.

## Edge, ports, TLS, WebSocket

- `openship-edge` is OpenResty 1.27 plus certbot on the host network (`G/apps/edge/Dockerfile`,
  `G/docker/docker-compose.yml`). It listens on 80 and 443, a management API on 127.0.0.1:9145,
  and certbot on 127.0.0.1:49180 while issuing (`G/apps/edge/nginx.conf`).
- Routing writes one vhost per project into `/var/lib/openship/edge/sites-enabled` and reloads
  OpenResty. Upstream is `http://127.0.0.1:<hostPort>` (`G/packages/adapters/src/infra/nginx.ts`).
- TLS comes from Let's Encrypt HTTP-01 (DNS-01 for wildcards). A custom domain needs its A record
  and a TXT `_openship-challenge.<host>` record before verification, and the certificate is only
  requested after verification (`G/apps/api/src/modules/domains/domain.service.ts`).
- **WebSocket works through the edge:** every location sets `proxy_http_version 1.1`,
  `Upgrade $http_upgrade` and `Connection "upgrade"` (`nginx.ts`). The default nginx
  `proxy_read_timeout` of 60 s applies unless raised in the project's `routes.proxy` settings
  (`G/packages/core/src/proxy-settings.ts`). **Unverified:** whether Proof's collab socket sends
  traffic at least every 60 s. Raise `proxy_read_timeout` when attaching the domain.
  SSE needs `X-Accel-Buffering: no` because proxy buffering stays on.
- A raw port without a domain works: a compose port spec with an explicit `0.0.0.0` stays
  public, one without an IP is bound to 127.0.0.1 (`docker.ts`). The kit serves on
  `127.0.0.1:4327` before cutover and on `0.0.0.0:4317` after, through `ACADEMY_PORT_BIND`.
  **Unverified:** how a later edge domain route rewrites a routed compose port
  (`G/apps/api/src/lib/loopback-publish.ts` rewrites routed ports to loopback).

## Deploys, health, rollback

- Git-push auto-deploy runs through the GitHub App or a webhook, only for projects with
  `autoDeploy` on. Linking a repo turns it on (`project-crud.service.ts`), so `deploy` turns it
  off explicitly. Deploys then come only from `openship-academy.yml`.
  A public GitHub repo clones anonymously (preflight `isPublicRepo`); no GitHub App install is required for Academy. Scoped PAT still needs `github_repository:…:read` for `assertGitHubRepoAccess`.
- The readiness gate is off by default. The project body turns it on for `/game/health`
  with `onFailure: "fail"`, so a failing deploy keeps the previous one serving
  (`G/packages/core/src/types.ts`). **Unverified:** whether a services project applies the
  project-level readiness to each compose service.
- The default `routeStrategy` (`loopback-port`) stops the old container before starting the new
  one, so each deploy has a short gap. `container-ip` is zero-downtime but needs the edge route.
- Rollback redeploys a previous deployment's frozen config and env, rebuilding at its commit
  or using the retained image, within `rollbackWindow` (5 in the project body)
  (`G/apps/api/src/modules/deployments/rollback/rollback-orchestrator.ts`).
- **Every project env var is also passed as a Docker build arg**
  (`G/packages/adapters/src/runtime/docker-build-args.ts`). The root `Dockerfile` declares no
  `ARG`, so the values are not written into image layers, but they do reach the build step.
