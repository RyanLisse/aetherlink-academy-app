# HTML course surfaces (AET-130 · AET-131)

Mirrored from the existing Academy course sources:

## W4 Solos (AET-130)

Pinned to the open companion PR heads; re-pin after they merge.

- `RyanLisse/weather-agent-sdk@2be920bf5f9f7b256044d7f2b76c661e4ef5921a`
- `RyanLisse/aetherlink-day5-n8n-to-agent@601279384db7c0afdad511fd3b42d2aba7b6c60d`
- `RyanLisse/council-agent-sdk@0a078c2786f356591b506a5036321748cfae01aa`

## W5 daily-brief (AET-131)
- `RyanLisse/aetherlink-daily-brief-lab-s1@3dea7c15cb10147cc28ebdc1c305edb34a8e8f96` (HTML course modules 01–06 + Assignments templates + SOLO.md + rulebook companions)

Academy Done path = HTML/lab surfaces linked from Workshop day-packs. Claude Code `/start-solo` is **not required** for these tickets (→ AET-132 concepts). Source EN course body stays EN (SoT); touched Academy chrome remains locale-safe.

`main.js` and `styles.css` are the same codebase-to-course engine in every course (byte-identical copies, as the engine header asks: "Copy this file verbatim into the course output directory"). They stay per course so each mirror matches its source repo and each page loads `main.js` / `styles.css` relative to itself.
