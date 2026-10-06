# HTML course surfaces (AET-130 · AET-131)

Mirrored from the existing Academy course sources:

## W4 Solos (AET-130)

Pinned to the companion repositories' `main` after their standalone PRs merged.

- `RyanLisse/weather-agent-sdk@54dbd68c4cae56d7202e6b97aafba023673ea5c6`
- `RyanLisse/aetherlink-day5-n8n-to-agent@339a8ec029fec39a13a9c77cf9aecfc2b152b217`
- `RyanLisse/council-agent-sdk@5df4d7f25ac6d07356fb45015598b4871bfbc379`

## W5 daily-brief (AET-131)
- `RyanLisse/aetherlink-daily-brief-lab-s1@3dea7c15cb10147cc28ebdc1c305edb34a8e8f96` (HTML course modules 01–06 + Assignments templates + SOLO.md + rulebook companions)

## Solo mission · SRE first responder
- `RyanLisse/sre-oncall-agent@0c8358dcfc61ed09c9d54a5175836da0084a3634`
- pinned to PR #1 head; re-pin to main after it squash-merges

Academy Done path = HTML/lab surfaces linked from Workshop day-packs. Claude Code `/start-solo` is **not required** for these tickets (→ AET-132 concepts). Source EN course body stays EN (SoT); touched Academy chrome remains locale-safe.

`main.js` and `styles.css` are the same codebase-to-course engine in every course (byte-identical copies, as the engine header asks: "Copy this file verbatim into the course output directory"). They stay per course so each mirror matches its source repo and each page loads `main.js` / `styles.css` relative to itself.
