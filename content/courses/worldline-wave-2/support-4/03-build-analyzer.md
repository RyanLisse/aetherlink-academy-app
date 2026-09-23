---
lesson: build-analyzer
day: support-4
course: worldline-wave-2
mode: solo
durationMinutes: 45
title:
  en: Build your analyzer
  nl: Bouw je analyzer
lede:
  en: Implement Risk / Reason / Recommended action with the tool of your choice.
  nl: Implementeer Risk / Reason / Recommended action met de tool van jouw keuze.
---

## Slide: Challenge card — build

```yaml
kicker: Challenge
type: concept
layout: cards
title: Challenge card — build your analyzer
cards:
  - title: Goal
    body: Flag seeded suspicious rows; limit false positives; explain every flag
  - title: Output
    body: "Per txn: Risk / Reason / Recommended action"
  - title: Tooling
    body: Free — starter script, n8n, agent, or your own notebook
  - title: Constraint
    body: Fictional Reconciliation · drafts only · human gate
```

> notes:
> EN: Starter path day-04/starter is optional — originality scores under Creativity.
> NL: Starterpad day-04/starter is optioneel — originaliteit scoort onder Creativity.

## Slide: Tight hints (do not spoil)

```yaml
kicker: Hints
type: concept
layout: steps
title: Tight hints (do not spoil)
steps:
  - "Prefer combinations over single thresholds"
  - "Night + new device + high amount is a useful compound"
  - "history_* columns catch spikes vs personal baseline"
  - "Decoy rows look loud but stay clean under a tight rule"
expected: "Learners leave with a working analyzer draft — not a leaked answer key"
```

> notes:
> EN: Facilitators may peek at tests/expected.json; learners should not.
> NL: Facilitators mogen tests/expected.json inkijken; learners niet.

## Slide: Practice — emit the required format

```yaml
kicker: Practice
type: practice
layout: exercise
title: Emit Risk / Reason / Recommended action for the CSV
timer: 25
assignment:
  title:
    en: Analyzer run — required format
    nl: Analyzer-run — vereiste vorm
  timer: 25
  starterPath: day-04/starter
  steps:
    - en: "Load training-lab/day-04/data/transactions.csv"
      nl: "Laad training-lab/day-04/data/transactions.csv"
    - en: "Produce one line per flagged (or all) transactions"
      nl: "Maak één regel per geflagde (of alle) transacties"
    - en: "Keep Risk / Reason / Recommended action on each line"
      nl: "Houd Risk / Reason / Recommended action op elke regel"
    - en: "Note your false-positive guess before compare"
      nl: "Noteer je false-positive-inschatting vóór de compare"
  expected: "Lines in Risk / Reason / Recommended action; FP guess noted"
  check: "Format present; fiction IDs only; no live PSP writes claimed"
  hints:
    - en: "Optional: node training-lab/day-04/starter/run.mjs"
      nl: "Optioneel: node training-lab/day-04/starter/run.mjs"
    - en: "If you use n8n or an agent, export the same three fields"
      nl: "Als je n8n of een agent gebruikt, exporteer dezelfde drie velden"
```

> notes:
> EN: Collect drafts for the compare round — do not auto-grade.
> NL: Verzamel drafts voor de compare-ronde — niet auto-graden.
