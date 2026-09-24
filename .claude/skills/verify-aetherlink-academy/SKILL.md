---
name: verify-aetherlink-academy
description: "Launch, drive and prove AetherLink Academy the way facilitators and participants use it: the legacy gateway on :4317 (squad room, Proof editor, /mcp) plus the apps/web SPA it serves (/classroom/1, /deck, /workshop/3..7), on a disposable local run with its own TLS Postgres/Redis, or read-only against Hetzner production. Use after a UI, deck, runtime or deploy change, before claiming a feature works."
---

# Verify AetherLink Academy

The product users touch is one Express gateway (`scripts/start.mjs` → `server/app.mjs`) that also spawns the vendored Proof editor on loopback. It serves three surfaces from one origin:

- `/` is the legacy squad game (`src/`, built to `dist/`): join, squad room, Proof intent document, lesson, solo evidence, review.
- `/classroom/1`, `/deck`, `/workshop/3..7`, `/lesson/*`, `/live/*` are the `apps/web` SPA (built to `apps/web/dist/`).
- `/mcp` is the participant remote MCP endpoint (Streamable HTTP, bearer token per participant).

Production is the same image on Hetzner at `http://91.99.78.17:4317`. The `apps/server` "wave" runtime (`infra/compose.yaml`, :4318) is a sibling that is loopback-only on the box; locally it is optional (`--wave`). Read [features/README.md](features/README.md) before driving anything.

## Launch

Needs Node 24, pnpm 11.19, Docker, `openssl`. Build once per checkout (installs both lockfiles, builds Proof, `dist/`, `apps/web/dist`, `apps/server/dist`):

```sh
node scripts/setup.mjs
```

Start a disposable run from the repo root:

```sh
node .claude/skills/verify-aetherlink-academy/helpers/start.mjs          # gateway + Proof
node .claude/skills/verify-aetherlink-academy/helpers/start.mjs --wave   # also apps/server on :4732
```

It refuses to start when a run is already recorded or any verification port is bound. Ports are fixed and chosen to avoid the other stacks on this machine: Academy `4731`, Proof `4831`, wave `4732`, Postgres `4733`, Redis `4734`. It then:

1. Mints a throwaway self-signed cert under `.verification/runs/<run-id>/tls/` (the storage layer rejects non-TLS Postgres and Redis).
2. Starts TLS Postgres and TLS Redis via `helpers/services.compose.yaml` as compose project `academy-verify-<run-id>`, data in tmpfs.
3. Launches `scripts/start.mjs` as its own detached process group with a clean env (no inherited `.env`, Google SSO or Vercel variables). `ACADEMY_HOST_KEY` is left unset so the gateway generates a per-run key in `<run>/academy-data/host-key`. Read it from that file when a recipe needs facilitator access; never print it.

Ready means the command prints `READY run=<run-id> academy=http://127.0.0.1:4731 ...`, which it only does after `/game/health` returns `{"ok":true,"proof":true}`. On failure it names the log (`.verification/runs/<run-id>/academy.log`) and leaves the run recorded for cleanup.

## Doctor

Read-only. Run it first, and again whenever anything looks off:

```sh
node .claude/skills/verify-aetherlink-academy/helpers/doctor.mjs
node .claude/skills/verify-aetherlink-academy/helpers/doctor.mjs --deployed
```

Local mode checks: manifest revision equals `git rev-parse --short HEAD`, each recorded process group is alive, ports 4731/4732 are held by this run's process groups (not some other process), both compose containers are running, `/game/health` is ok+proof and reports the run revision, and `/classroom/1` serves the SPA. `--deployed` probes Hetzner health and three public pages with GET only. Every line is `PASS`/`FAIL`; the last line is `DOCTOR OK` or `DOCTOR FAILED`. Do not drive an instance whose doctor fails; clean it up and start again.

## Drive

Use Playwright (`@playwright/test` from the root devDependencies, Chromium from the Playwright cache). Prefer ARIA roles and accessible names, then stable ids (`#count`, `#progress`, `#stage`) and `data-testid`s. Selectors per feature are in the feature files.

The scripted drive for the classroom deck:

```sh
node .claude/skills/verify-aetherlink-academy/helpers/drive-classroom.mjs              # local run
node .claude/skills/verify-aetherlink-academy/helpers/drive-classroom.mjs --deployed   # Hetzner, read-only
```

It opens `/classroom/1` in projector mode, advances with the `Next slide` button and with `ArrowRight`, reopens in `?mode=presenter&index=2`, checks reader mode, and fails on page errors or unexpected HTTP errors. For other features, write the same shape of script from the feature file's recipe, or use the repo harness it names (`pnpm test:e2e` for `/live`, the MCP client scripts for `/mcp`).

## Evidence

Everything goes to `.verification/evidence/<run-id>/` (gitignored via `/.verification/`). Deployed drives go to `.verification/evidence/deployed-<timestamp>/`. The classroom drive writes `classroom/*.png` (full-page, after entrance animations settle), `classroom/*.aria.yml` ARIA snapshots, and `classroom/state.json` with every step, observed values, run id and revision. Cleanup adds `run.json` and `logs/`.

Proof standards:

- Drive the path a facilitator or participant uses: routes, buttons, keys. Not `/game/*` calls from a script when a UI path exists, and never test fixtures such as `apps/server/src/mcp/lab-server.ts`.
- Capture the action and the resulting state (before and after screenshots plus `state.json`), not only the final screen.
- For writes (join, evidence, review, Proof edits), read the result back from a second view: reload, a second browser context, or the facilitator overview.
- Open and look at the screenshots. A faded or blank slide means the capture raced an animation.
- Deployed mode is GET-only. No joins, no squad creation, no MCP token rotation, no evidence against production.

## Cleanup

After every attempt, including failed starts and failed drives:

```sh
node .claude/skills/verify-aetherlink-academy/helpers/cleanup.mjs
node .claude/skills/verify-aetherlink-academy/helpers/cleanup.mjs --run <run-id>   # a stranded run whose pointer is gone
```

It TERMs (then KILLs after 30 s) only the process groups recorded in the manifest, runs `docker compose -p academy-verify-<run-id> down --volumes`, copies logs and `run.json` into the evidence dir, deletes `.verification/runs/<run-id>/` (data dir, generated host key, TLS key), and clears the pointer. It ends with `CLEANUP OK` only after confirming all five ports are free, no containers of the project remain, and the evidence dir still exists. It never kills by name or port and never touches other compose projects.

## Helpers

All in `helpers/`, executable, run from the repo root with `node`:

- `start.mjs [--wave]` launches a run (above).
- `doctor.mjs [--deployed]` is the read-only health gate.
- `drive-classroom.mjs [--deployed]` proves the classroom deck.
- `cleanup.mjs [--run <id>]` tears down and keeps evidence.
- `lib.mjs` holds the port table, paths and manifest reader. `services.compose.yaml` is the disposable TLS Postgres/Redis. The password in it is a dev-only placeholder.

Supporting checks that are not user-path proof: `pnpm test`, `pnpm test:e2e` (builds `apps/web`, starts `apps/server/src/live/e2e-server.ts` on `ACADEMY_LIVE_PORT`, default 5178), `pnpm run test:legacy`.

When routes, labels or runtimes change, update the feature map in the same change.
