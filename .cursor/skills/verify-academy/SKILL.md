---
name: verify-academy
description: Drive AetherLink Academy (NL learning env — squads, facilitator, classroom/Harness ConceptSim) the way a user does. Use when proving facilitator home/squad create, ConceptSim locale (nl attribution, no EN leak), or Apps/Tools after a real local or soft-live instance is up.
---

# Verify Academy

Scripted control for **AetherLink Academy** (`aetherlink-academy` 0.1.0). Primary surface is the web UI on **port 4317**. Proof is a collaborative iframe; Redis (TLS) + Postgres back live rooms.

Run every command from the **repository root**. Prefer ARIA roles and accessible names over CSS or coordinates.

```bash
node .cursor/skills/verify-academy/scripts/control.mjs launch
node .cursor/skills/verify-academy/scripts/control.mjs doctor
node .cursor/skills/verify-academy/scripts/control.mjs drive facilitator-home
node .cursor/skills/verify-academy/scripts/control.mjs stop
```

## Launch

### Local disposable (preferred when Docker + Node 24 are available)

1. Start TLS Postgres + Redis the same way CI does (writes env under a temp dir):

```bash
export CI_SERVICES_DIR="${CI_SERVICES_DIR:-/tmp/academy-verify-services}"
bash scripts/ci-services.sh start
# shellcheck source=/dev/null
source "$CI_SERVICES_DIR/env.sh"
```

2. Install + build once, then start:

```bash
node scripts/setup.mjs
node --env-file=.env scripts/start.mjs
# If you have no .env yet, write one from the sourced CI env (see Helpers / control.mjs launch).
```

If Docker Hub pulls are rate limited (HTTP 429), pull `mirror.gcr.io/library/postgres:16` and `mirror.gcr.io/library/redis:7-alpine`, tag them as `postgres:16` and `redis:7-alpine` (the names `scripts/ci-services.sh` expects), then rerun `start`. Never fall back to production.

Ready when `GET http://127.0.0.1:4317/game/health` returns JSON with `ok: true` (and usually `proof: true`). The start log prints `Academy: http://127.0.0.1:4317`. Facilitator break-glass key is auto-written to `.data/host-key` when `ACADEMY_HOST_KEY` is unset.

`control.mjs launch` runs the CI services (if Docker is present), writes a disposable `.env`, runs setup when `dist/` is missing, starts `scripts/start.mjs` as a detached process group, and records PIDs under `.cursor/skills/verify-academy/.run/`.

Ports **4317** (app) and **4400** (Proof loopback) are shared defaults. Two local instances cannot run side by side. If those ports already answer and the pidfile is not ours, `launch` refuses.

### Deployed soft-live harness (when local secrets/Docker are unavailable)

- URL: `https://academy.91-99-78-17.sslip.io/`
- Health: `https://academy.91-99-78-17.sslip.io/game/health`
- Auth: Google facilitator SSO **or** `ACADEMY_HOST_KEY` (break-glass). Without one of these, squad create and in-room ConceptSim proofs are blocked.
- Live tip may lag `main` until OpenShip; doctor reports the revision. Set `ACADEMY_VERIFY_TARGET=deployed` and `ACADEMY_URL` / `ACADEMY_HOST_KEY` before `doctor` / `drive`.

Teardown for local is `control.mjs stop` (see Cleanup). Never stop the deployed soft-live.

## Doctor

Read-only. Answers "is this instance worth driving?"

```bash
node .cursor/skills/verify-academy/scripts/control.mjs doctor
```

Requires:

- Health URL returns 200 JSON with `ok: true`
- For local: this skill owns the recorded PID **or** `ACADEMY_VERIFY_ALLOW_SHARED=1` is set for a user-started instance
- Optional: `revision` printed for tip matching

Run doctor first whenever anything looks off. A shared or deployed instance is read-only for process control: never `stop` it.

## Drive

Read `feature-map/README.md`, then the matching feature file. Prefer those recipes over improvising.

Harness:

- Browser via Playwright (repo already depends on `@playwright/test`) or Cursor browser / Chrome DevTools tools
- HTTP via `control.mjs http <url>` for health and static checks
- Stable handles (NL chrome; switch locale with the language toggle):
  - Start: radio `Ik ben facilitator` / `I am a facilitator` (Segmented role), radio `Ik ben deelnemer` / `I am a participant`, textbox `Facilitator-startsleutel`/`Facilitator start key`, button `Inloggen`/`Sign in`, then in the workspace textbox `Squadnaam`/`Squad name`, button `Maak squad`/`Create squad`, button `Deelnemen`/`Join`, textbox `Kamercode`/`Room code`, textbox `Je naam`/`Your name`
  - Room: heading `/^(Jouw squad|Your squad) \(/`, navigation `Hoofdnavigatie`/`Main navigation`, button `Squad en hulp`, title `Kopieer kamercode`/`Copy room code`
  - Locale: group `Taal` / `Language` (`locale.label`), buttons `NL` / `EN` (`aria-pressed`)
  - ConceptSim: section/slot `Conceptsimulatie` / `Concept simulation`, group `Simulatorbediening` / `Simulator controls`, buttons `Afspelen`/`Play`, `Stap vooruit`/`Step forward`, `Opnieuw`/`Reset`; attribution in `.sim-attribution`
  - Nav: `Meer`, course / lesson panels as labeled in each feature file

Workspace navigation (participant and facilitator):

- Facilitator Day controls can sit under `Meer`/`More` → Session settings; open that menu before looking for the Day combobox.
- Participant Solo: `Meer`/`More` → `Solo-missie`/`Solo mission`. Assignments: course tab `Les`/`Lesson` → `Opdrachten`/`Assignments`.
- Peer review: `Meer`/`More` → Review & handoff. Facilitator Solo: Day pack → Assignments → Open the solo mission.
- Changing locale or room day can reset the course subtab to Lesson; reopen Assignments and check the selected tab before capturing.
- Every day pack with `pack.steps` (Day 1 included, not only workshop days) renders Solo as step cards (`data-testid="step-card"`); the legacy task list is only for step-less packs.
- After navigation or a locale switch, wait for the target instruction list; an immediate DOM read can hit an empty transitional render.
- Use the accessible TypeScript/Python button names for code toggles instead of guessed test IDs.
- The generated `.data/host-key` can be read into browser memory to fill the facilitator key field; never print it or show it in screenshots or artifacts.

Do not call internal setters or invent a `control-academy` CLI beyond this skill's thin `control.mjs`. Prefer the real start-screen and Lesson panel paths.

## Evidence

Proof artifacts live in `.cursor/skills/verify-academy/artifacts/<feature-id>/`. Cleanup must **not** delete them. **Never commit** proof assets to a product branch (gitignored).

Capture standards:

- Exercise the real user path (browser), not only `/game/health`
- Capture the action and the resulting state (screenshot + ARIA snapshot, or short Playwright video)
- For mutations (squad create), read back from a second user-facing view (room heading + visible squad code)
- Record the feature ID in `meta.json`
- Inspect every capture before treating it as proof

## Cleanup

```bash
node .cursor/skills/verify-academy/scripts/control.mjs stop
```

Sends SIGTERM (then SIGKILL) to the process group recorded in `.run/pids.json` only. Optionally stops CI Docker services when this skill started them (`ciServices: true` in the pidfile). Never `pkill` node/vite/postgres by name. Leaves `artifacts/` in place. If doctor ran under `ACADEMY_VERIFY_ALLOW_SHARED=1` or `ACADEMY_VERIFY_TARGET=deployed`, do not stop.

## Helpers

```bash
node .cursor/skills/verify-academy/scripts/control.mjs launch
node .cursor/skills/verify-academy/scripts/control.mjs doctor
node .cursor/skills/verify-academy/scripts/control.mjs drive facilitator-home
node .cursor/skills/verify-academy/scripts/control.mjs drive conceptsim-locale
node .cursor/skills/verify-academy/scripts/control.mjs http http://127.0.0.1:4317/game/health
node .cursor/skills/verify-academy/scripts/control.mjs stop
```

Repo scripts this skill wraps (do not reinvent):

- `node scripts/setup.mjs` — install + build
- `node --env-file=.env scripts/start.mjs` — local runtime
- `bash scripts/ci-services.sh start|stop` — TLS Postgres + Redis for disposable local
- `scripts/deployed-browser-acceptance.mjs` — full deployed acceptance (needs `ACADEMY_URL` + `ACADEMY_HOST_KEY`); heavier than feature-map recipes

Feature map path for AetherLink accept: `.cursor/skills/verify-academy/feature-map/` (pstack `features/` naming is satisfied by this directory; do not add a second map).
