---
lesson: scout-and-plan
day: teaching-1
course: worldline-wave-2
mode: guided
durationMinutes: 30
title:
  en: Scout first, then the smallest useful plan
  nl: Eerst scouten, dan het kleinste nuttige plan
lede:
  en: Read the workspace before acting. Split into investigate → plan → small change → verify → handoff.
  nl: Lees de werkmap vóór handelen. Splits in onderzoeken → plannen → kleine wijziging → verifiëren → overdragen.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 (fixture safety-net pattern) + server/content.mjs L1-SCOUT / L1-PLAN
  note: Adapted from content.mjs; importers own the 78-slide deck.
---

## Slide: Scout before edit

```yaml
kicker: Concept
type: concept
layout: steps
title: Read-only repository scout
steps:
  - "Ask for paths, concrete observations, and a stop rule"
  - "Treat README claims as claims until checked against files and runnable scripts"
  - "Return three paths, one uncertainty, and what you will not do yet"
expected: "A scout note that a navigator can re-run without changing files"
```

> notes:
> EN: L1-SCOUT. Emphasise stop rules — no secrets, no client systems, no push.
> NL: L1-SCOUT. Benadruk stopregels — geen secrets, geen clientsystemen, geen push.

## Slide: Smallest useful plan

```yaml
kicker: Concept
type: concept
layout: compare
title: Plan one README correction
columns:
  - title: In scope
    items:
      - "One useful workflow with a named check"
      - "Compare README.md to package.json scripts"
      - "Record what falls explicitly outside"
  - title: Out of scope
    items:
      - "Larger refactors without a check"
      - "External Jira/GitLab/Confluence access"
      - "Invented command output"
```

> notes:
> EN: L1-PLAN. Bigger is not proof of better — one reversible step.
> NL: L1-PLAN. Groter is geen bewijs van beter — één omkeerbare stap.

## Slide: Practice — scout note + plan

```yaml
kicker: Practice
type: practice
layout: exercise
title: Produce a scout note and a one-step plan
timer: 20
assignment:
  title:
    en: Scout note + smallest plan
    nl: Scout-notitie + kleinste plan
  timer: 20
  starterPath: teaching/day-1/starter
  steps:
    - en: "List three concrete paths under teaching/day-1/starter"
      nl: "Noteer drie concrete paden onder teaching/day-1/starter"
    - en: "Write one uncertainty and one stop rule"
      nl: "Schrijf één onzekerheid en één stopregel"
    - en: "Plan one README correction with its verification command"
      nl: "Plan één README-correctie met het verificatiecommando"
    - en: "State what is explicitly out of scope"
      nl: "Noem wat expliciet buiten scope valt"
  expected: "Scout + plan a second participant can execute without guessing"
  check: "Three paths; uncertainty; stop rule; one planned check named"
  hints:
    - en: "Prefer node --test from package.json over inventing new scripts"
      nl: "Kies node --test uit package.json boven nieuwe scripts verzinnen"
```

> notes:
> EN: Do not edit files in this lesson — edits land in lesson 03.
> NL: Bewerk in deze les geen bestanden — wijzigingen in les 03.
