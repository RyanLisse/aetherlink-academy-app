---
lesson: claude-agent-sdk
day: support-2
course: worldline-wave-2
mode: solo
durationMinutes: 45
title:
  en: Solo — Claude Agent SDK starter
  nl: Solo — Claude Agent SDK starter
lede:
  en: Rebuild the same weather decision in Claude Agent SDK; wire day-1 n8n as an MCP tool stand-in.
  nl: Bouw dezelfde weer-beslissing in Claude Agent SDK; koppel dag-1 n8n als MCP-tool stand-in.
---

## Slide: Solo — Claude Agent SDK starter

```yaml
kicker: Solo
type: concept
layout: steps
title: Solo — Claude Agent SDK starter
steps:
  - "Open training-lab/day-02/claude-agent-sdk/"
  - "Reuse Get Weather tool helper + weather skill"
  - "Bring your own Claude Agent SDK credential (never commit)"
  - "Acceptance stays on the deterministic helper until a model run is evidenced"
```

> notes:
> EN: Preflight — Agent SDK credit or API key with budget. No secrets in repo.
> NL: Preflight — Agent SDK-tegoed of API-key met budget. Geen secrets in de repo.

## Slide: Same test, same decision

```yaml
kicker: Concept
type: concept
layout: compare
title: Same test, same decision
columns:
  - title: Fixture
    items:
      - "Amsterdam · 2026-09-21"
      - "expectedDecision: bring umbrella"
      - "tests/weather-agent.test.mjs"
  - title: Runtimes
    items:
      - "Eve agent.mjs path"
      - "Claude Agent SDK agent.mjs path"
      - "Identical weather + decision objects"
```

> notes:
> EN: One fixture file: day-02/data/weather-input.json — do not invent a second case.
> NL: Eén fixture: day-02/data/weather-input.json — verzin geen tweede case.

## Slide: Extend — tools / docs / skills

```yaml
kicker: Extend
type: concept
layout: pillars
title: Extend — tools, docs, skills
items:
  - label: Tools
    caption: get_weather.mjs + n8n_weather_mcp.mjs
  - label: MCP
    caption: Day-1 n8n weather agent as n8n_day1_weather stand-in
  - label: Skills
    caption: skills/weather.md — same ≥60% rule
```

> notes:
> EN: Live n8n MCP Server Trigger is the stretch; stand-in proves the contract offline.
> NL: Live n8n MCP Server Trigger is stretch; stand-in bewijst het contract offline.

## Slide: Practice — SDK + shared test

```yaml
kicker: Practice
type: practice
layout: exercise
title: Pass the shared weather test from the SDK folder
timer: 25
assignment:
  title:
    en: Claude Agent SDK — same decision
    nl: Claude Agent SDK —zelfde beslissing
  timer: 25
  starterPath: day-02/claude-agent-sdk
  steps:
    - en: "Read README.md and mcp/n8n-day1-weather.mjs"
      nl: "Lees README.md en mcp/n8n-day1-weather.mjs"
    - en: "Run day-02 tests — Eve, SDK, and n8n MCP stand-in must agree"
      nl: "Run day-02 tests — Eve, SDK en n8n MCP stand-in moeten overeenkomen"
    - en: "Optional stretch: point Agent SDK MCP config at a live n8n MCP Server Trigger on weather-agent.json"
      nl: "Optionele stretch: wijs Agent SDK MCP-config naar een live n8n MCP Server Trigger op weather-agent.json"
    - en: "Note credential mode actually used (or OPEN if none)"
      nl: "Noteer gebruikte credential-modus (of OPEN als geen)"
  expected: "bring umbrella for Amsterdam fixture; draft_only true on MCP stand-in"
  check: "weather-agent.test.mjs PASS including n8n_day1_weather"
  hints:
    - en: "Stand-in imports decideWeather from day-01/starter/weather-agent.mjs — do not fork the threshold"
      nl: "Stand-in importeert decideWeather uit day-01/starter/weather-agent.mjs — fork de drempel niet"
```

> notes:
> EN: Stretch MCP Server Trigger needs learner n8n Cloud — mark UNKNOWN without screenshot.
> NL: Stretch MCP Server Trigger vraagt learner n8n Cloud — markeer UNKNOWN zonder screenshot.
