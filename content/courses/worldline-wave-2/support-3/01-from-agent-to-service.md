---
lesson: from-agent-to-service
day: support-3
course: worldline-wave-2
mode: guided
durationMinutes: 35
title:
  en: From agent to small service
  nl: Van agent naar kleine service
lede:
  en: Move from chat-shaped agents to a deployable alert draft service on fictional transactions.
  nl: Van chat-vormige agents naar een deploybare alert-draft service op fictieve transacties.
---

## Slide: From agent to small service

```yaml
kicker: Support day 3 · los op
type: context
layout: pillars
title: From agent to small service
items:
  - label: New shape
    caption: A small HTTP service you own — not only an n8n canvas
  - label: Same gate
    caption: Alert drafts only — human approval before any action
  - label: Same world
    caption: Fictional Reconciliation — no live Worldline PSP feeds
```

> notes:
> EN: Contrast day-1/2 agents with a containerised service boundary. Fewer open hints today.
> NL: Contrast day-1/2 agents met een containergrens. Minder open hints vandaag.

## Slide: Fictional transactions — find the deviation

```yaml
kicker: Concept
type: concept
layout: compare
title: Fictional transactions — find the deviation
columns:
  - title: Cohort
    items:
      - "TX-FIC-301 · €1200 · NL-TRAIN"
      - "TX-FIC-303 · €340 · NL-TRAIN"
      - "TX-FIC-304 · €2100 · LU-TRAIN"
  - title: Seeded deviation
    items:
      - "TX-FIC-302 · €12500 · BE-TRAIN"
      - "seededDeviation: true"
      - "Expected severity: high"
```

> notes:
> EN: Dataset download lives on the assignment card → training-lab/day-03/data/transactions.json.
> NL: Dataset-download staat op de opdrachtkaart → training-lab/day-03/data/transactions.json.

## Slide: Practice — inspect the mock

```yaml
kicker: Practice
type: practice
layout: exercise
title: Hit the mock and name the deviation
timer: 12
assignment:
  title:
    en: Mock API — find TX-FIC-302
    nl: Mock API — vind TX-FIC-302
  timer: 12
  starterPath: day-03/starter
  steps:
    - en: "Start mock: node training-lab/day-03/mock-api/server.mjs"
      nl: "Start mock: node training-lab/day-03/mock-api/server.mjs"
    - en: "GET /transactions and locate TX-FIC-302"
      nl: "GET /transactions en vind TX-FIC-302"
    - en: "Note amountEur, region, seededDeviation"
      nl: "Noteer amountEur, region, seededDeviation"
  expected: "TX-FIC-302 amountEur 12500 with seededDeviation true"
  check: "curl/jq output shows the seeded row; no live PSP mentioned"
  hints:
    - en: "Default mock base is http://127.0.0.1:48139"
      nl: "Standaard mock-base is http://127.0.0.1:48139"
```

> notes:
> EN: Keep the room on the fixture — do not invent production volumes.
> NL: Houd de zaal bij de fixture — verzin geen productievolumes.
