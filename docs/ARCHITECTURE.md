# Academy architecture (v2)

One public origin, `https://academy.aetherlink.ai`, serves everything a participant or facilitator opens. Behind it runs one Node 24 process tree on the Hetzner CX33 `aetherlink-academy` (see [DEPLOYMENT.md](DEPLOYMENT.md)). This page describes what runs where today. It is not a roadmap.

```
browser ──HTTPS──> gateway (server/app.mjs, :4317)
                     ├── legacy React client        dist/            (built from src/)
                     ├── apps/web SPA               apps/web/dist/   (deck, classroom, workshop, reference, archive, live)
                     ├── apps/arcade-lab            apps/arcade-lab/dist/ at /arcade-lab
                     ├── /mcp (Streamable HTTP)     participant's own Claude Code
                     ├── reverse proxy ──────────> Proof (vendor/proof-sdk, loopback :4400)
                     ├── Postgres                   server/postgres-store.mjs
                     └── Redis (TLS)                server/presence.mjs, server/screen-state.mjs
```

## Process model

`scripts/start.mjs` validates the runtime configuration (`server/runtime-config.mjs`), starts Proof from `vendor/proof-sdk/server/index.ts` on loopback `PROOF_PORT` (default 4400), waits for its `/health`, then starts the gateway from `createApp` in `server/app.mjs` on `PORT` (default 4317). Only the gateway takes public traffic. The container image is `Dockerfile`; `Dockerfile.vercel` is the hardened variant the CI `container` job builds, and despite its name no longer depends on Vercel.

## Gateway (`server/`)

The gateway owns identity, authorization and every write. Its route groups in `server/app.mjs`:

- **Facilitators** sign in with Google SSO (`server/google-sso.mjs`).
- **Participants** use a personal cohort code that becomes an HttpOnly session (`server/cohort.mjs`). The locked access rule is 90 days from cohort start, then writing closes and Proof stays read-only for an optional 14 days. Room codes are for live sessions only.
- **Rooms and live state** (`/game/*`) with a WebSocket upgrade that the gateway authorizes before proxying.
- **MCP** at `/mcp`, stateless Streamable HTTP, authenticated per request and per tool call. The participant's own Claude Code connects here. The platform makes no model calls and holds no model credentials. `tests/integration.test.mjs` pins the exact tool list.
- **Day packs and search** from `server/content.mjs`, which reads `content/days/*.mjs`.
- **Proof proxy.** Browser, document, asset and WebSocket traffic reaches Proof only through the gateway (`server/proof.mjs` for the HTTP agent bridge).
- **SPA serving.** `isWebSpaPath` in `server/app.mjs` sends `/deck`, `/classroom/*`, `/workshop/*`, `/lesson/*`, `/live/*`, `/reference/*` and `/archive/*` to `apps/web/dist/index.html`. Everything else falls through to the legacy client in `dist/`.
- **Legacy redirects.** `/legacy-redirect?site=<site>&from=<old url>` answers a 301 from the table in `apps/web/src/redirects/legacy.ts` (see [Legacy sites](#legacy-sites)).

Node 24 runs workspace TypeScript directly, so the gateway imports pure logic from `packages/*` without a build step (`packages/lab-embed`, `packages/actions` via `server/screen-state.mjs`, `packages/schema` via `server/quiz.mjs`).

## Storage

- **Postgres** is the durable authority: squads, cohorts, sessions, Proof documents, marks, Yjs history, leases and snapshots. The Academy schema lives in `server/schema/academy.sql`. `init()` in `server/postgres-store.mjs` records a version and SHA-256 checksum in `system_metadata` and refuses to start on a mismatch. Migrations are numbered in that file.
- **Redis** (TLS `rediss:` only) carries participant presence (`server/presence.mjs`) and multi-tab screen-state fan-out (`server/screen-state.mjs`). It is never the source of truth.
- `server/local-store.mjs` is the file-backed store for tests and local runs.

## Proof

Proof is [EveryInc/proof-sdk](https://github.com/EveryInc/proof-sdk) pinned at `fb2578758f1c62776301209131181643c5f4a19a` (MIT) under `vendor/proof-sdk`. It is the rich editor, marks and provenance engine, canonical document store and live collaboration server. The gateway keeps Proof owner secrets, binds Proof to loopback, and sets `COLLAB_PUBLIC_BASE_URL` to the gateway `/ws`. Suggested text stays a suggestion until a human accepts it.

## Apps

| Path | What it is | Deployed |
| --- | --- | --- |
| `apps/web` | React 19 SPA: classroom and workshop decks, reference reader, training-site archive, live classroom, facilitator panels | Yes, served by the gateway |
| `apps/arcade-lab` | Agent Arcade solo lesson runtime, embedded through `packages/lab-embed` | Yes, at `/arcade-lab` |
| `apps/server` | Effect + Drizzle workspace server, content importers (`src/importers/`), authoring and curriculum repo | No. Tests and import CLIs run it; production does not |

## Packages

| Path | Role | Consumers |
| --- | --- | --- |
| `packages/schema` | Effect schemas: `Slide`, quizzes, rooms, progress | apps/web, apps/server, packages/deck, gateway |
| `packages/deck` | React deck (`projector`, `presenter`, `follow`, `reader` modes). Pixel parity against the source deck is gated by `.github/workflows/deck-ci.yml` | apps/web |
| `packages/actions` | Shared action definitions and the WebMCP / screen-state adapters | apps/web, gateway |
| `packages/lab-embed` | postMessage contract and grading between Academy and a lab | gateway, apps/arcade-lab |
| `packages/i18n` | EN/NL catalogs | apps/web, apps/server |
| `packages/branding` | Tokens and chrome CSS | legacy client, `server/portal` |

## Content

- `content/days/*.mjs` holds the live 7-day course (Classroom 1–2, Workshop 3–7), validated by `content/days/validate.mjs`.
- `content/courses/worldline-wave-2/` holds Markdown lessons; `content/scripts/lint-*.mjs` lint each day pack.
- The decks in `apps/web/src/deck/*-slides.ts` are the rendered slide sources for each day.
- `content/archive/training-site.json` is the archived Squad 1/2 course version from the old training site, generated by `pnpm --filter @academy/server import-archive`. It is read-only history; see `content/archive/README.md`.
- `training-lab/` holds participant starters and mocks referenced by lesson `starterPath`.

## Agent-native apps (OpenShip)

The BuilderIO agent-native apps are separate deployments, tracked in `infra/native-apps/apps.manifest.json` and `infra/native-apps/openship-projects.json`. Chat is deployed with authentication but no AI provider. The slides proof of concept runs separately. Assets, calendar, clips and content are registered, not deployed. None of them share the gateway's process or database.

## Legacy sites

Two older sites predate the Academy. Their content now lives on the Academy origin, and their URLs map through `apps/web/src/redirects/legacy.ts`.

| Old site | Hosting | Old URLs | New page |
| --- | --- | --- | --- |
| `RyanLisse/aetherlink-training-site` | ChatGPT Sites, `aetherlink-training.ryanlisse.chatgpt.site` (`.openai/hosting.json` publishes `dist/`) | `/?squad=S&day=D#N`, `/?lesson=daily-brief`, `/glossary.html`, `/` | `/archive/squad-S/day-D#slide-archive-sS-dayD-N`, `/workshop/4`, `/reference/glossary`, `/archive` |
| `jyse/aetherlink-classroom-slides` | No public hosting in the repo (no Pages, no host config; `serve.py` for local use) | `/#N`, `/presenter.html#N` | `/classroom/1?index=N-1` for N ≤ 44, else `/classroom/2?index=N-45`, plus `mode=presenter` |

Both old sites route on the query string and the URL hash. A server never sees the hash, and ChatGPT Sites offers no redirect rules. So the old host serves a static stub that forwards `location.href` to `/legacy-redirect`, and the gateway answers the 301. `tests/legacy-redirect.test.mjs` asserts every target.

Operator steps (not done by this change):

1. Generate the stubs: `node --experimental-strip-types apps/web/scripts/legacy-stubs.ts <out> https://academy.aetherlink.ai`.
2. Training site: in a checkout of `RyanLisse/aetherlink-training-site`, replace `dist/index.html` and `dist/glossary.html` with `<out>/training-site/*`, commit, and publish that commit through ChatGPT Sites with the existing `project_id` from `.openai/hosting.json`, as the repo README describes. Keep the other `dist/` files until the stub is live, then remove them.
3. Classroom slides: if any copy is hosted, replace its `index.html` and `presenter.html` with `<out>/classroom-slides/*`. Otherwise nothing to deploy; the table still documents the mapping.
4. Verify: open `https://aetherlink-training.ryanlisse.chatgpt.site/?squad=1&day=3#5` and expect `https://academy.aetherlink.ai/archive/squad-1/day-3#slide-archive-s1-day3-5`.

## Operator runbooks

- [Deploy apps/server next to the gateway](runbooks/apps-server-deploy.md): sibling Compose on :4318, env list, Drizzle migrations, rollback, access for automated deploys.
- [Google OAuth for facilitators](runbooks/google-oauth.md): OAuth client, redirect URIs, env for both servers, `login_error` codes.
- [SMTP for email login](runbooks/smtp-email-login.md): sending setup that leaves the `aetherlink.ai` mail records intact, env, handshake check.

## Decisions

- [ChatGPT sign-in as a second chat runner](decisions/chatgpt-runner-terms.md): not built; terms do not clearly allow it.
