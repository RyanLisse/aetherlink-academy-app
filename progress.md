# Progress — AetherLink Academy

Last updated: 2026-09-30 — `main` at `3665827` (AET-83, [#177](https://github.com/RyanLisse/aetherlink-academy-app/pull/177)).

Sources: `git log` on `main` and live `curl` checks on 2026-09-30. Linear (https://linear.app/aetherlink) was **not** readable when this was written, so ticket statuses below come from merged PRs only; anything not shown by a merged PR or a live check is marked *unverified*.

## Live

| Item | Status |
| --- | --- |
| Public origin | `https://academy.91-99-78-17.sslip.io/` (OpenShip edge, HTTPS) |
| App health | `GET https://academy.91-99-78-17.sslip.io/game/health` → `{"ok":true,"proof":true,"revision":"3665827…"}`, i.e. production runs the current `main` tip |
| Raw host | `http://91.99.78.17:4317` times out externally (expected after the OpenShip `domain` step, see `docs/runbooks/single-academy-openship.md`) |
| Target origin | `https://academy.aetherlink.ai` does not resolve yet (NXDOMAIN) — AET-42 |
| Host | Hetzner CX33 NBG1 `aetherlink-academy` / `91.99.78.17` |
| Data | Postgres + Redis inside the OpenShip project `aetherlink-academy`; data moved by `pg_dump`/restore at the 2026-09-27 cutover |
| Deploy path | Manual workflow **Academy on OpenShip (manual)** (`.github/workflows/openship-academy.yml`). The push-to-main `deploy-hetzner.yml` was removed in [#110](https://github.com/RyanLisse/aetherlink-academy-app/pull/110); a merge to `main` does not deploy by itself |

## Shipped since the last update (merged to `main`, 2026-09-21 → 2026-09-29)

- **Runtime / infra:** Vercel retired (AET-18, #21); OpenShip migration kit and cutover (#108–#129, #133), sslip public URL in docs (#130), room-scoped object storage (#131).
- **Foundation (Effect/TS sibling runtime):** AET-20, AET-21, AET-22, AET-24, AET-26, AET-27, AET-28, AET-29, AET-44, AET-51, AET-53, AET-54.
- **Content and curriculum:** support days 1–5 and teaching packs (AET-36–AET-41), 7-day day packs + n8n L1–L3 (AET-84, AET-76), Notion import (AET-33), search (AET-32), course composition (AET-92), naslagwerk (AET-104), archive import + redirects (AET-43).
- **Classroom and workshop decks:** Classroom 1–2 (AET-75, AET-76, AET-121, AET-129), Workshops 3–7 (AET-77, AET-79, AET-80, AET-81, AET-85), Open Classroom overlay + deck authoring (AET-105–AET-107, AET-126), ConceptSim / Harness verticals (AET-116, AET-117, AET-118).
- **Learning loop:** quizzes (AET-88), assignments as Proof trail (AET-94), Arcade Lab embed + graded stops (AET-87, AET-95, AET-63, AET-66, AET-70–AET-73), debrief board (AET-90), autograde triage (AET-103).
- **Cohorts and credentials:** Wave cohorts + access codes (AET-82, AET-89), certificates + badges (AET-97, AET-133), optional email OTP (AET-57), Google SSO in apps/server (AET-6, AET-25).
- **MCP / agents:** `get_screen_state` parity and release filter (AET-96, AET-98, AET-100), Claude|Codex agent setup (AET-119), FAQ chat + Leercoach on OpenRouter free models (AET-83, AET-31).
- **UI / a11y / i18n:** facilitator bar + join screen + visual CI (AET-8), axe gate (AET-8), mobile fixes (AET-101, AET-102), teach-path IA (AET-115), participant workspace (AET-127), shadcn chat shell first slice (AET-120), EN-default locale + paired TS/Python code (AET-122), thin UI polish (AET-134).
- **Solo packs:** W4 HTML Solos (AET-130, #169/#170), W5 daily-brief (AET-131), C1–C2 concepts Solo-in-Claude (AET-132).

Full list: `git log --first-parent main --since=2026-09-21`.

## In flight

- No open PRs on GitHub other than the 2026-09-30 improvement wave (CI test coverage, Dockerfile unification, legacy React lint fixes, gateway `server/app.mjs` split, repo hygiene/docs).
- Linear ticket states (In Progress / In Review / Backlog) are *unverified* — check https://linear.app/aetherlink.
- Partial slices on `main` that name follow-up work: AET-120 (shadcn/AI Elements chat shell, "first slice"), AET-82 / AET-83 soft-live checks (#176, #177). Whether further slices are planned is *unverified*.

## Blocked / parked

- **Custom domain (AET-42):** `academy.aetherlink.ai` has no A record; the registrar step is Ryan's. Until it resolves, the sslip origin is the only public origin. Google OAuth redirect URIs and `ACADEMY_PUBLIC_URL` for the custom domain follow after that (see `docs/domain-godaddy.md`).
- **Vercel side of AET-18:** disconnecting the GitHub integration and archiving the Vercel project were listed as Ryan's steps on 2026-09-21; current state *unverified*.

## Recently decided

- One Academy only, deployed through OpenShip (Ryan, 2026-09-26; `docs/runbooks/single-academy-openship.md`). `apps/server` (academy-wave stack) is not deployed.
- Academy Linear SoT = https://linear.app/aetherlink (not `aetherlink-academy`).
- Committed screenshots under `artifacts/` were removed from Git (2026-09-30); the `scripts/*-screenshots.mjs` helpers still write there locally and the evidence lives on the PRs that added it: #5, #6, #7 (lx-pr2..4), #11 (lis-54), #13 (lis-56), #34 (lis-60), #35 (aet-63).

## Next / related

- **Open cleanup:** `Dockerfile.vercel` is still the hardened image the CI `container` job builds, and the plain `Dockerfile` lacks its `SOURCE_REVISION` arg and pinned digest. Merging the two touches the production build and is handled separately.
- AET-42 domain cutover, then OAuth redirect URIs for the custom origin.
