# Claude Agent SDK starter (solo)

Rebuild the day-1 weather agent with the participant's own Claude Agent SDK
credential. This folder is the in-repo skeleton; the shared acceptance test
calls the deterministic helper and does **not** claim a model-backed run.

## Layout

| Path | Role |
| --- | --- |
| `agent.mjs` | Test harness + re-exports (`decideWeather`, `fetchWeatherDecision`, `callN8nDay1Weather`) |
| `tools/get_weather.mjs` | **Get Weather** URL helper |
| `tools/n8n_weather_mcp.mjs` | Agent SDK tool face for day-1 n8n-as-MCP |
| `mcp/n8n-day1-weather.mjs` | MCP stand-in for day-1 `weather-agent.json` |
| `skills/weather.md` | Decision skill |
| `subagents/` | Data Analyst · Tester · Report Generator (compare slide) |

## Step names

Must match `training-lab/day-01/STEP-NAMES.md`.

## Preflight

Participants need their own model credential (Agent SDK credit on a Claude plan,
or an API key with budget). Never commit credentials.
