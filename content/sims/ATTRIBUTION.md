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

## Ported chapters (Slice 1+)

| Id | Upstream | Notes |
|---|---|---|
| `s01.json` | `web/src/data/scenarios/s01.json` + `s01_agent_loop/` | Agent Loop |
| `s02.json` | `web/src/data/scenarios/s02.json` + `s02_tool_use/` | Tool Use |
| `s03.json` | `web/src/data/scenarios/s03.json` + `s03_permission/` | Permission System |

Harness sims ship `locales:{en,nl}` with real copy in both (AET-116 locale lock). Fixture remains flat EN-only.

Diagrams under `public/harness/*.svg` are the EN SVGs from the same upstream chapter `images/*.en.svg` folders (MIT).

## Academy fixtures

`fixture-agent-loop.json` is an Academy **surface** fixture for Slice 0. It
demonstrates the player only; it is **not** a Harness Engineering chapter.
Classroom day 1 still references it for surface proof.
