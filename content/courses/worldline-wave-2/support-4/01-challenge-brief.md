---
lesson: challenge-brief
day: support-4
course: worldline-wave-2
mode: guided
durationMinutes: 30
title:
  en: AI Data Challenge — brief
  nl: AI Data Challenge — briefing
lede:
  en: Frame the fraud-signal challenge on a fictional transactions.csv — drafts only, human gate.
  nl: Kader de fraud-signal challenge op een fictieve transactions.csv — alleen drafts, human gate.
---

## Slide: AI Data Challenge

```yaml
kicker: Support day 4 · AI Data Challenge
type: context
layout: pillars
title: AI Data Challenge — fraud signals
items:
  - label: Dataset
    caption: Seeded fictional transactions.csv — regenerate with the same seed for an identical file
  - label: Output
    caption: Per transaction — Risk / Reason / Recommended action
  - label: Gate
    caption: Human review drafts only — no live PSP / Worldline KPIs
```

> notes:
> EN: Keep the room in Fictional Reconciliation. Tooling is free (script, n8n, agent).
> NL: Houd de zaal in Fictional Reconciliation. Tooling is vrij (script, n8n, agent).

## Slide: What you are scoring

```yaml
kicker: Concept
type: concept
layout: cards
title: What you are scoring (facilitator — manual)
cards:
  - title: Fraud found
    body: Did you catch the seeded suspicious rows?
  - title: False positives
    body: How many clean rows did you flag by mistake?
  - title: Explanation
    body: Can a human follow Risk / Reason / Recommended action?
  - title: Simplicity · Efficiency · Creativity
    body: Clean rules beat clever fog — facilitators score by hand (no auto-grade)
```

> notes:
> EN: Six criteria total. Ceiling lives in tests/reference-solution.mjs (FP count).
> NL: Zes criteria totaal. Ceiling staat in tests/reference-solution.mjs (FP-count).

## Slide: Practice — open the brief card

```yaml
kicker: Practice
type: practice
layout: exercise
title: Open the challenge card and name the output shape
timer: 10
assignment:
  title:
    en: Challenge card — output shape
    nl: Challengekaart — outputvorm
  timer: 10
  starterPath: day-04/starter
  steps:
    - en: "Open training-lab/day-04/README.md"
      nl: "Open training-lab/day-04/README.md"
    - en: "Write one sample line as Risk / Reason / Recommended action"
      nl: "Schrijf één voorbeeldregel als Risk / Reason / Recommended action"
    - en: "Confirm fiction: TX-FIC-* IDs only"
      nl: "Bevestig fictie: alleen TX-FIC-*-IDs"
  expected: "One sample line in Risk / Reason / Recommended action; no live PSP names"
  check: "Output shape named; Fictional Reconciliation intact"
  hints:
    - en: "Example shape: TX-FIC-430: high / new device with high amount / human review"
      nl: "Voorbeeldvorm: TX-FIC-430: high / new device with high amount / human review"
```

> notes:
> EN: Tight hints only — do not reveal the full seeded ID list yet.
> NL: Alleen strakke hints — geef de volledige seeded-ID-lijst nog niet weg.
