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

When a chapter scenario is **ported** from that repo (Slice 1+ · s01–s17), keep
the MIT notice on the JSON (`attribution` field) and in the lesson footer.

## Academy fixtures

`fixture-agent-loop.json` is an Academy **surface** fixture for Slice 0. It
demonstrates the player only; it is **not** a Harness Engineering chapter.
