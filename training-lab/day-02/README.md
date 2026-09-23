# Day 2 · Rebuild the weather agent

Same input and expected decision for Eve (guided) and Claude Agent SDK (solo).
The weather call stays on the training-lab mock so the model does not change the
acceptance result. Shared tests execute the deterministic helper — they do **not**
claim a model-backed Eve or Claude run.

| Path | Use |
| --- | --- |
| `eve/` | Guided directory agent · Eve pin **0.64.1** · plan-B under `eve/demo-fallback/` |
| `claude-agent-sdk/` | Solo starter · day-1 n8n as MCP stand-in · sub-agents |
| `mastra/` · `adk-go/` | Optional README deepening only |
| `tests/weather-agent.test.mjs` | Shared acceptance (Eve + SDK + n8n MCP stand-in) |
| `data/weather-input.json` | **Weather Input** fixture (Amsterdam → bring umbrella) |

Step names: `../day-01/STEP-NAMES.md`.

## Preflight

Participants need their own model credential (Agent SDK credit or API key with
budget). No credential belongs in this repository. If the chosen model is
unavailable, run the deterministic acceptance test and record the missing model
run as OPEN.
