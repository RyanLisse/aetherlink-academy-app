# Academy verification map

This directory is the maintained source for verifying user-facing AetherLink Academy behavior. Read this index before driving the app, then use the matching feature file as the recipe.

Academy is an NL-first learning environment: facilitator-led squads, classroom/Harness lessons with ConceptSim step-throughs, Proof collaboration, and locale-locked content (`en`/`nl` — no EN leak under `nl`).

## Baseline preconditions

- Local: Academy healthy at `http://127.0.0.1:4317` with disposable Postgres+Redis from `scripts/ci-services.sh` (or an equivalent TLS `REDIS_URL` + `DATABASE_URL`).
- Deployed soft-live: `https://academy.91-99-78-17.sslip.io/` with facilitator Google SSO or `ACADEMY_HOST_KEY`.
- Health: `GET <origin>/game/health` → `{ok:true,...}`.
- Run `node .cursor/skills/verify-academy/scripts/control.mjs doctor` and require `ok: true`.
- Never `stop` an instance this skill did not `launch`. Never stop soft-live.
- Prefer ARIA roles and accessible names. Treat helper commands as literal.
- Do not delete proof artifacts during cleanup.

## Driving conventions

- Start every recipe from the baseline unless its preconditions say otherwise.
- Facilitator path: `Ik ben facilitator` → fill `Squadnaam` + `Facilitator-startsleutel` → `Maak squad`.
- Participant path: fill `Je naam` + `Kamercode` → `Deelnemen`.
- Locale: use the language toggle (`NL` / `EN`) before asserting content language.
- ConceptSim attribution under `nl` must be Dutch (or Academy NL copy); EN strings in attribution under `nl` fail the locale lock.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot and/or ARIA snapshot with Academy identity visible.
- Mutation proof includes a second user-facing read-back (room heading + squad code).
- Record the feature ID in `artifacts/<id>/meta.json`.
- Report an unreachable path with the unmet prerequisite. Do not mark it verified via a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then exactly four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with control.mjs`, `Gotchas`.

## Features

- [Facilitator home / squad create](./facilitator-home.md) covers start screen, host-key facilitator login, squad create, and visible squad code.
- [Classroom / ConceptSim locale](./conceptsim-locale.md) covers Harness or workshop ConceptSim under `nl` with Dutch attribution and no EN leak.
- Optional later: Apps / Tools room (after stable handles land for #161).
