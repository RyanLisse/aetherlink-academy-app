---
lesson: weather-agent
day: support-1
course: worldline-wave-2
mode: guided
durationMinutes: 45
title:
  en: Weather agent in n8n
  nl: Weer-agent in n8n
lede:
  en: Build a bounded weather agent against the training-lab mock. Outputs are drafts only.
  nl: Bouw een begrensde weer-agent op de training-lab mock. Output is alleen draft.
source:
  repo: RyanLisse/aetherlink-agent-lab
  commit: 765d99a656ac34005b9be53bdfb5daf7878b810a
  path: n8n/workflows + training-lab weather mock (AET-35)
---

## Slide: Day frame

```yaml
kicker: Support day 1 · volg mij
type: context
layout: pillars
title: Fictional Reconciliation — day 1 in n8n
items:
  - label: Learn by building
    caption: Guided explain → solo build → review with evidence
  - label: Human gate
    caption: Draft messages only — no real sends or payment writes
  - label: Shared step names
    caption: Webhook → Get Weather → Weather Agent → IF Decision → Draft Message (reuse on day 2)
```

> notes:
> EN: Frame the day as Fictional Reconciliation only. No Worldline KPIs or live tickets.
> NL: Kader de dag als Fictional Reconciliation. Geen Worldline-KPI’s of live tickets.

## Slide: Agent shape

```yaml
kicker: Concept
type: concept
layout: steps
title: The weather agent contract
steps:
  - "Webhook receives city + date (+ optional weatherBaseUrl)"
  - "Weather Input normalises the payload"
  - "Weather Agent calls Get Weather (HTTP tool → training mock)"
  - "IF Decision branches on bring umbrella / leave umbrella"
  - "Draft Message (or Draft No Reminder) — human reviews before any action"
expected: "Same Get Weather contract as day-2 Eve and Claude Agent SDK"
```

> notes:
> EN: Point at training-lab/day-01/starter/weather-agent.json and day-02 get_weather helpers.
> NL: Verwijs naar weather-agent.json en de day-02 get_weather helpers.

## Slide: Decision rule

```yaml
kicker: Concept
type: concept
layout: compare
title: Deterministic umbrella rule
columns:
  - title: Fixture
    items:
      - "Amsterdam · 2026-09-21"
      - "precipitationProbability 70"
      - "decision → bring umbrella"
  - title: Guardrails
    items:
      - "draft_only: true"
      - "human_approval_required: true"
      - "No public weather provider"
```

> notes:
> EN: Threshold is 60% — matches decideWeather in weather-agent.mjs.
> NL: Drempel is 60% — gelijk aan decideWeather in weather-agent.mjs.

## Slide: Practice — import and run

```yaml
kicker: Practice
type: practice
layout: exercise
title: Import the weather agent and capture one execution
timer: 25
assignment:
  title:
    en: Weather agent — one draft run
    nl: Weer-agent — één draft-run
  timer: 25
  starterPath: day-01/starter
  steps:
    - en: "Start mocks: pnpm --filter training-lab start:mocks"
      nl: "Start mocks: pnpm --filter training-lab start:mocks"
    - en: "In n8n Cloud trial (or local n8n) · Import from File · weather-agent.json"
      nl: "In n8n Cloud trial (of lokaal n8n) · Import from File · weather-agent.json"
    - en: "Select a chat-model credential on OpenAI Chat Model (learner-owned; never commit)"
      nl: "Kies een chat-model credential op OpenAI Chat Model (van de deelnemer; nooit committen)"
    - en: "Set weatherBaseUrl so Get Weather can reach the mock (local 127.0.0.1:48135 or your tunnel)"
      nl: "Zet weatherBaseUrl zodat Get Weather de mock bereikt (lokaal 127.0.0.1:48135 of je tunnel)"
    - en: "POST the Webhook test URL with {\"city\":\"Amsterdam\",\"date\":\"2026-09-21\"}"
      nl: "POST de Webhook test-URL met {\"city\":\"Amsterdam\",\"date\":\"2026-09-21\"}"
    - en: "Save the execution log / screenshot as evidence"
      nl: "Bewaar het execution log / screenshot als bewijs"
  expected: "Get Weather returns the Amsterdam fixture; IF Decision routes to Draft Message; draft_only true"
  check: "Execution shows Webhook → Weather Input → Weather Agent (+ Get Weather) → IF Decision → Draft Message"
  hints:
    - en: "If Cloud cannot reach localhost, tunnel the mock or set weatherBaseUrl to a reachable host — keep the same path /weather?city=&date="
      nl: "Als Cloud localhost niet bereikt, tunnel de mock of zet weatherBaseUrl op een bereikbare host — zelfde pad /weather?city=&date="
    - en: "Node names must stay exactly: Webhook, Weather Input, Get Weather, Weather Agent, IF Decision, Draft Message"
      nl: "Node-namen blijven exact: Webhook, Weather Input, Get Weather, Weather Agent, IF Decision, Draft Message"
```

> notes:
> EN: Evidence = n8n execution log. Do not claim a Cloud run without a real screenshot.
> NL: Bewijs = n8n execution log. Claim geen Cloud-run zonder echt screenshot.
