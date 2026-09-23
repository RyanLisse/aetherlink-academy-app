---
lesson: review-transfer
day: teaching-2
course: worldline-wave-2
mode: guided
durationMinutes: 20
title:
  en: Transfer — same pattern across systems
  nl: Transfer — hetzelfde patroon over systemen
lede:
  en: Source and output change; design questions stay. Close teaching days into support days.
  nl: Bron en output veranderen; ontwerpvragen blijven. Sluit teaching-dagen af richting support-dagen.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 transfer slides + server/content.mjs L2-WORKFLOW / L2-HANDOFF
  note: Adapted; importers own the 78-slide deck.
---

## Slide: Five transfer questions

```yaml
kicker: Review
type: review
layout: cards
title: For the item you retrieved, decide
cards:
  - title: Source
    body: What is the trusted source?
  - title: Output
    body: What useful work output would help?
  - title: Method
    body: What reusable method could create it?
  - title: Verify
    body: What should Claude verify?
  - title: Gate
    body: Which action requires human approval?
```

> notes:
> EN: Possible outputs — ticket brief, MR summary, acceptance-criteria review, onboarding article. Keep fictional.
> NL: Mogelijke outputs — ticketbrief, MR-samenvatting, acceptatiecriteria-review, onboarding-artikel. Blijf fictief.

## Slide: Same pattern

```yaml
kicker: Concept
type: concept
layout: compare
title: The same pattern across systems
columns:
  - title: Aether Library
    items:
      - "Glossary source → concept card → validation → human approval"
  - title: Connected training systems
    items:
      - "Mock Jira / GitLab / Confluence → useful work output → validation → human approval"
```

> notes:
> EN: Tagline — source and output change; design questions remain. Then point to support-1 weather agent day.
> NL: Tagline — bron en output veranderen; ontwerpvragen blijven. Daarna doorverwijzen naar support-1 weer-agent-dag.

## Slide: Practice — close-out handoff

```yaml
kicker: Practice
type: practice
layout: exercise
title: Teaching-2 close-out handoff
timer: 10
assignment:
  title:
    en: Teaching-2 handoff into support days
    nl: Teaching-2 handoff naar support-dagen
  timer: 10
  starterPath: teaching/assignment-10
  steps:
    - en: "Record which MCP server (or plan-B fixture) you used"
      nl: "Noteer welke MCP-server (of plan-B fixture) je gebruikte"
    - en: "Paste tool listing evidence path + one result summary"
      nl: "Plak pad van tool-listing-bewijs + één resultaatsamenvatting"
    - en: "Answer the five transfer questions in one short paragraph"
      nl: "Beantwoord de vijf transfervragen in één korte alinea"
    - en: "Name one support-day follow-up (n8n / Eve / SDK) as OPEN or planned"
      nl: "Noem één support-day vervolg (n8n / Eve / SDK) als OPEN of gepland"
  expected: "Readable handoff another facilitator can audit without Worldline access"
  check: "Mock-or-fixture path explicit; five questions answered; no secrets; no live Worldline claims"
  hints:
    - en: "If you only used plan-B fixtures, say so — that still closes Assignment 10 teaching intent"
      nl: "Als je alleen plan-B fixtures gebruikte, zeg dat — dat sluit Assignment 10 lesintent nog steeds"
```

> notes:
> EN: Do not mark Linear Done until AetherLink copy ACCEPT.
> NL: Markeer Linear niet Done tot AetherLink copy ACCEPT.
