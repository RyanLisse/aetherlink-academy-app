---
lesson: signals-and-dataset
day: support-4
course: worldline-wave-2
mode: solo
durationMinutes: 35
title:
  en: Signals and the seeded dataset
  nl: Signalen en de geseede dataset
lede:
  en: Inspect columns, regenerate the fixed seed, and pick first signals without overfitting.
  nl: Bekijk kolommen, regenereer met fixed seed, kies eerste signalen zonder overfitting.
---

## Slide: Columns you can use

```yaml
kicker: Dataset
type: concept
layout: cards
title: Columns you can use
cards:
  - title: Context
    body: "time · region · merchant_name · merchant_category"
  - title: Payment
    body: "payment_method · device · amount_eur"
  - title: History
    body: "history_24h_count · history_avg_eur"
  - title: Fiction
    body: "TX-FIC-* · * Example * merchants · *-TRAIN regions"
```

> notes:
> EN: expected_risk is facilitator ground truth — learners should not train on it as a feature.
> NL: expected_risk is facilitator-grondwaarheid — learners mogen die niet als feature gebruiken.

## Slide: Fixed seed = identical file

```yaml
kicker: Concept
type: concept
layout: steps
title: Fixed seed = identical file
steps:
  - "SEED=20260921 in data/generate.mjs"
  - "node data/generate.mjs twice → same sha256"
  - "Hash pinned in tests/expected.json"
expected: "Regenerating yields an identical transactions.csv"
```

> notes:
> EN: Determinism is the acceptance proof — not a live fraud KPI.
> NL: Determinisme is het acceptatiebewijs — geen live fraud-KPI.

## Slide: Practice — regenerate and inspect

```yaml
kicker: Practice
type: practice
layout: exercise
title: Regenerate and list first signals
timer: 15
assignment:
  title:
    en: Dataset inspect — seed + signals
    nl: Dataset inspecteren — seed + signalen
  timer: 15
  starterPath: day-04/starter
  steps:
    - en: "Run node training-lab/day-04/data/generate.mjs twice"
      nl: "Run node training-lab/day-04/data/generate.mjs twee keer"
    - en: "Confirm the file did not change (sha256 or diff)"
      nl: "Bevestig dat het bestand niet wijzigde (sha256 of diff)"
    - en: "Name 2–3 signals you will try first (tight — no full solution)"
      nl: "Noem 2–3 signalen die je eerst probeert (strak — geen volledige oplossing)"
  expected: "Identical hash after regenerate; 2–3 named signals; fiction intact"
  check: "SEED acknowledged; no live PSP columns invented"
  hints:
    - en: "Hint: device + amount often co-occur on seeded cases — that is not the only pattern"
      nl: "Hint: device + amount komen vaak samen voor op seeded cases — dat is niet het enige patroon"
    - en: "Hint: a high amount alone is not enough (watch the decoy)"
      nl: "Hint: alleen een hoog bedrag is niet genoeg (let op de decoy)"
```

> notes:
> EN: Keep hints tight. Do not publish the seeded ID list on this slide.
> NL: Houd hints strak. Publiceer de seeded-ID-lijst niet op deze slide.
