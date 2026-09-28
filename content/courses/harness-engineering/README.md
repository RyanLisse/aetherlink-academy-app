# Harness Engineering (Academy track)

**Linear:** AET-116 · AET-117  
**Upstream SoT (MIT):** [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) — Copyright 2024 shareAI Lab  
**Locales:** **EN + NL** required (content language = UI locale). Soft live checks both.  
**Production:** Academy-native narrative + SVG + ConceptSim. **Do not** iframe `learn.shareai.run`.

## Slice 1 chapters (day packs 8–10)

| Day | Chapter | Mechanism | Sim | Diagram |
|---|---|---|---|---|
| 8 | s01 Agent Loop | messages / while True / tool_use | `content/sims/s01.json` (`locales.en` + `locales.nl`) | `/diagrams/harness/s01-agent-loop.svg` |
| 9 | s02 Tool Use | TOOL_HANDLERS / dispatch | `content/sims/s02.json` | `/diagrams/harness/s02-tool-dispatch.svg` |
| 10 | s03 Permission | deny → ask → allow | `content/sims/s03.json` | overview + pipeline SVGs |

Day packs declare `copy:{en,nl}` (real narrative, motto, quiz, mission in both locales).

## How to open in-room

1. Facilitator → **Course** → **Harness Engineering** → Save.
2. Toggle chrome **EN** then **NL** (soft live both).
3. Select day position 1 (pack day 8 / s01) → **Lesson**.
4. Confirm narrative, diagram(s), and ConceptSim match the active locale (no API key).
5. Advance to s02 / s03 the same way.

Worldline Wave (days 1–7) stays the default route when no course is applied. Classroom 1 still ships the Slice 0 `fixture-agent-loop` surface proof (EN fixture OK for surface-only).

## Attribution

See `content/sims/ATTRIBUTION.md` and each lesson footer (`pack.attribution`).
