# Day 1 ↔ Day 2 shared step names

These names are stable across the day-1 n8n weather agent and the day-2 Eve /
Claude Agent SDK rebuilds. Do not rename casually — AET-37 depends on them.

| Canonical name | Day-1 n8n node | Day-2 reuse |
| --- | --- | --- |
| `Webhook` | Webhook trigger | HTTP/entry equivalent in platform docs |
| `Weather Input` | Set — `city`, `date`, `weatherBaseUrl` | `training-lab/day-02/data/weather-input.json` |
| `Get Weather` | HTTP Request Tool → `GET {base}/weather?city=&date=` | `eve/tools/get_weather.ts`, `claude-agent-sdk/tools/get_weather.mjs` |
| `Weather Agent` | AI Agent coordinator | Eve / Claude agent entry |
| `IF Decision` | IF on `decision` (`bring umbrella` / `leave umbrella`) | `decideWeather` in `day-01/starter/weather-agent.mjs` (imported by day 2) |
| `Draft Message` | Set draft output (`draft_only`, `human_approval_required`) | Human-reviewed draft — never auto-send |

Decision threshold: `precipitationProbability >= 60` → `bring umbrella`.
