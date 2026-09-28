# Concept sim scenarios — attribution

Academy ships step-through simulators so learners see agent loops **without API keys**.

## Upstream pattern (MIT)

Scenario JSON shape (`version`, `title`, `description`, `steps[]` with
`user_message` | `assistant_text` | `tool_call` | `tool_result` | `system_event`)
is compatible with [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)
`web/src/data/scenarios/*.json`.

```
MIT License
Copyright (c) 2024 shareAI Lab
```

When a chapter scenario is **ported** from that repo (s01–s17), keep
the MIT notice on the JSON (`attribution` field) and in the lesson footer.

## Ported chapters (Slice 1 + Slice 2)

| Id | Upstream | Notes |
|---|---|---|
| `s01.json` | `web/src/data/scenarios/s01.json` + `s01_agent_loop/` | Agent Loop |
| `s02.json` | `web/src/data/scenarios/s02.json` + `s02_tool_use/` | Tool Use |
| `s03.json` | `web/src/data/scenarios/s03.json` + `s03_permission/` | Permission System |
| `s04.json` | `web/src/data/scenarios/s04.json` + `s04_hooks/` | Hook System |
| `s05.json` | `web/src/data/scenarios/s05.json` + `s05_todo_write/` | TodoWrite |
| `s06.json` | `web/src/data/scenarios/s06.json` + `s06_subagent/` | Subagent |
| `s07.json` | `web/src/data/scenarios/s07.json` + `s07_skill_loading/` | Skill Loading |
| `s08.json` | `web/src/data/scenarios/s08.json` + `s08_context_compact/` | Context Compact |
| `s09.json` | `web/src/data/scenarios/s09.json` + `s09_memory/` | Memory |
| `s10.json` | `web/src/data/scenarios/s10.json` + `s10_task_system/` | Task System |
| `s11.json` | `web/src/data/scenarios/s11.json` + `s11_background_tasks/` | Background Tasks |
| `s12.json` | `web/src/data/scenarios/s12.json` + `s12_cron_scheduler/` | Cron Scheduler |
| `s13.json` | `web/src/data/scenarios/s13.json` + `s13_agent_teams/` | Agent Teams |
| `s14.json` | `web/src/data/scenarios/s14.json` + `s14_mcp_plugin/` | MCP Plugin |
| `s15.json` | `web/src/data/scenarios/s15.json` + `s15_integrated_harness/` | Integrated Harness |
| `s16.json` | `web/src/data/scenarios/s16.json` + `s16_workflow_runtime/` | Workflow Runtime |
| `s17.json` | `web/src/data/scenarios/s17.json` + `s17_goal_loop/` | Goal Loop |

Harness sims ship `locales:{en,nl}` with real copy in both (AET-116 locale lock). Fixture remains flat EN-only.

Diagrams under `public/diagrams/harness/*.svg` are the EN SVGs from the same upstream chapter `images/*.en.svg` folders (MIT). s16/s17 use the plain overview SVGs where `.en.svg` was not published.

## Academy fixtures

`fixture-agent-loop.json` is an Academy **surface** fixture for Slice 0. It
demonstrates the player only; it is **not** a Harness Engineering chapter.
Classroom day 1 still references it for surface proof.

## Workshop retrofit sims (AET-118)

| Id | Notes |
|---|---|
| `w5-sdlc-loop.json` | Academy-authored Plan→gate step-through for Workshop 5 / AET-77 (P0). Scenario shape compatible with learn-claude-code; **not** an upstream chapter port. Real `locales:{en,nl}`. |

Diagram: `public/diagrams/workshop/w5-harness-loop.svg` (Academy-authored).

