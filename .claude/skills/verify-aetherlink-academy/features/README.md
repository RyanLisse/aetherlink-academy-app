# AetherLink Academy verification map

The maintained source for verifying user-facing Academy behavior. Read this index, then the feature file for the path you are proving.

## Baseline preconditions

- A local run started with `helpers/start.mjs` (add `--wave` only where a feature says so) and a passing `helpers/doctor.mjs`.
- Academy gateway at `http://127.0.0.1:4731`. It serves `/` (legacy squad game), the `apps/web` SPA routes and `/mcp`.
- Facilitator access uses the per-run host key in `.verification/runs/<run-id>/academy-data/host-key`. Read it into a variable; never echo it or write it to evidence.
- Deployed checks target `http://91.99.78.17:4317` and are GET-only.
- Never drive an instance this run did not start.

## Driving conventions

- Playwright Chromium, viewport 1440x900, dark color scheme.
- Prefer ARIA roles and accessible names; then `#count`, `#progress`, `#stage`, `data-testid`.
- The legacy game defaults to English. Labels come from `src/i18n/en.json`; the `NL` toggle switches to Dutch labels from `nl.json`.
- Every person in a multi-person recipe gets a separate browser context (sessions are cookies).
- Wait for entrance animations to finish before screenshots.

## Proof and skip reporting

- Save to `.verification/evidence/<run-id>/<feature-id>/`: screenshots, ARIA snapshots, and a `state.json` with steps and observed values.
- Writes are proven by reading back from a second view (reload, second context, facilitator overview).
- Report an entry point you could not reach with the attempted command and the unmet precondition. A skipped path is not verified through a different one.

## Feature entry contract

Each file has an H1, a one-paragraph summary, then exactly these H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with Playwright`, `Gotchas`.

## Features

Status as of 2026-09-24 at 768910c. Proven means the recipe was executed end to end; recipe-only files were written from routes, labels and specs and have not been run yet.

- [Classroom deck](./classroom-deck.md) covers `/classroom/1` and `/deck` in projector, presenter, reader and follow modes. Proven for projector, button and key navigation, presenter and reader via `helpers/drive-classroom.mjs`; `/deck`, Chapters and Example prompt are recipe-only.
- [Workshop decks](./workshop-decks.md) covers `/workshop/3` to `/workshop/7` and their `/lesson/workshop-N` aliases. Recipe-only.
- [Squad room](./squad-room.md) covers facilitator squad creation, participant join, roster roles and soft rejoin in the legacy game. Recipe-only.
- [Proof evidence and review](./proof-evidence-review.md) covers the shared Proof intent document, solo evidence submission and facilitator review. Recipe-only.
- [Remote MCP](./remote-mcp.md) covers participant MCP tokens and the `/mcp` tools, plus where `get_screen_state` and release policy actually live. Recipe-only; the 401 on unauthenticated `/mcp` was observed.
- [Live follow](./live-follow.md) covers `/live/<room>/presenter|follow|projector` sync, detach and "everyone back". Proven through the repo harness only (`live-sync.spec.ts`, 2 passed on port 4735); not deployed on the gateway.
