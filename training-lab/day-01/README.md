# Day 1 · Weather to ticket triage (n8n)

Build a weather decision agent against the deterministic local weather HTTP
service, then rise through Set / Code / Switch draft alerts, and finish with the
fictional support-triage challenge (`WL-1026`).

Lesson pack (slides EN; cards/notes/hints EN+NL):
`content/courses/worldline-wave-2/support-1/`.

## Canonical step names (reuse on day 2)

Keep these names identical when rebuilding in Eve / Claude Agent SDK:

| Step | Role |
| --- | --- |
| `Webhook` | Entry |
| `Weather Input` | Normalise `city`, `date`, `weatherBaseUrl` |
| `Get Weather` | HTTP tool → `GET {base}/weather?city=&date=` |
| `Weather Agent` | AI coordinator |
| `IF Decision` | `bring umbrella` vs `leave umbrella` |
| `Draft Message` | Draft only — human gate |

Decision helper (deterministic, no model): `starter/weather-agent.mjs`
(`decideWeather` / `fetchWeatherDecision`). Threshold: precipitation ≥ 60 →
`bring umbrella`.

## Starters

Import from `day-01/starter/`:

| File | Purpose |
| --- | --- |
| `weather-agent.json` | Webhook → Get Weather → Weather Agent → IF → Draft Message |
| `rising-steps.json` | Ticket Input → Code Priority → Switch → draft alerts (+ Get Weather tool stub) |
| `support-triage.json` | Adapted upstream triage challenge (draft only) |
| `weather-agent.mjs` | Local deterministic helper used by tests and day 2 |

Upstream provenance: `training-lab/UPSTREAM-PROVENANCE.md` (`765d99a…`).
Adapted from `upstream/aetherlink-agent-lab/n8n/workflows/support-triage.json`
and `scenarios/support-triage/`.

## Run mocks first

```sh
pnpm install --frozen-lockfile && pnpm --filter training-lab start:mocks
```

Weather mock: `http://127.0.0.1:48135/weather`.

## Guardrails

Fictional Reconciliation only. Outputs are **drafts**. No real customer sends,
no live Jira/GitLab/PSP, no Worldline KPIs or secrets in the workflow JSON.
