# Harness Engineering (Academy track)

**Linear:** AET-116 · AET-117  
**Upstream SoT (MIT):** [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) — Copyright 2024 shareAI Lab  
**Locales:** **EN + NL** required (content language = UI locale). Soft live checks both.  
**Production:** Academy-native narrative + SVG + ConceptSim. **Do not** iframe `learn.shareai.run`.

## Chapters (day packs 8–24)

| Day | Chapter | Mechanism | Sim | Diagram |
|---|---|---|---|---|
| 8 | s01 Agent Loop | messages / while True / tool_use | `s01.json` | `/diagrams/harness/s01-agent-loop.svg` |
| 9 | s02 Tool Use | TOOL_HANDLERS / dispatch | `s02.json` | `/diagrams/harness/s02-tool-dispatch.svg` |
| 10 | s03 Permission | deny → ask → allow | `s03.json` | overview + pipeline |
| 11 | s04 Hooks | Pre/PostToolUse | `s04.json` | `s04-hooks-overview.svg` |
| 12 | s05 TodoWrite | plan-then-execute | `s05.json` | `s05-todo-overview.svg` |
| 13 | s06 Subagent | fresh messages[] | `s06.json` | `s06-subagent-overview.svg` |
| 14 | s07 Skill Loading | catalog + load_skill | `s07.json` | `s07-skill-overview.svg` |
| 15 | s08 Context Compact | compaction budgets | `s08.json` | compact + layers |
| 16 | s09 Memory | store / recall | `s09.json` | overview + subsystems |
| 17 | s10 Task System | blockedBy / owner | `s10.json` | overview + DAG |
| 18 | s11 Background Tasks | threaded bash | `s11.json` | background overview |
| 19 | s12 Cron | durable schedule | `s12.json` | cron overview |
| 20 | s13 Agent Teams | teammates / worktrees | `s13.json` | teams + topology |
| 21 | s14 MCP Plugin | namespaced tools | `s14.json` | mcp-architecture |
| 22 | s15 Integrated Harness | many mechanisms, one loop | `s15.json` | system-architecture |
| 23 | s16 Workflow Runtime | script orchestration | `s16.json` | workflow overview |
| 24 | s17 Goal Loop | independent stop eval | `s17.json` | goal-loop overview |

Day packs declare `copy:{en,nl}` (real narrative, motto, quiz, mission in both locales).

## How to open in-room

1. Facilitator → **Course** → **Harness Engineering** → Save.
2. Toggle chrome **EN** then **NL** (soft live both).
3. Select day position for s01 (pack day 8) → **Lesson**.
4. Confirm narrative, diagram(s), and ConceptSim match the active locale (no API key).
5. Soft-live mid: advance to s07 (day 14) or s10 (day 17). Endpoint: s15 (day 22) or s17 (day 24).

Worldline Wave (days 1–7) stays the default route when no course is applied. Classroom 1 still ships the Slice 0 `fixture-agent-loop` surface proof (EN fixture OK for surface-only).

## Attribution

See `content/sims/ATTRIBUTION.md` and each lesson footer (`pack.attribution`).
