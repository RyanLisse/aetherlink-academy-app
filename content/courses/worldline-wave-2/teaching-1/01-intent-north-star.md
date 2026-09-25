---
lesson: intent-north-star
day: teaching-1
course: worldline-wave-2
mode: guided
durationMinutes: 25
title:
  en: Shared north star before tools
  nl: Gedeelde north star vóór tools
lede:
  en: Describe the problem before the solution. Humans own the goal and acceptance.
  nl: Beschrijf het probleem vóór de oplossing. Mensen bezitten doel en acceptatie.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md (decision 3 cited for MCP safety-net pattern) + server/content.mjs L1-INTENT / day-1 lesson
  note: Adapted from content.mjs day pack 1; not a rewrite of AET-7 tip packs. Importers own the 78-slide deck.
---

## Slide: Day frame

```yaml
kicker: Teaching day 1 · begeleid
type: context
layout: pillars
title: From a bounded goal to checkable evidence
items:
  - label: Intent first
    caption: Who hurts, what must improve, which observable proof counts
  - label: Human owns acceptance
    caption: AI proposes; the squad decides PASS / REVISE / OPEN
  - label: Atlas only
    caption: Fictional starter under training-lab/teaching/day-1 — no client systems
```

> notes:
> EN: Frame teaching-1 as the content.mjs day-1 pack (intent → evidence), not the full 78-slide importer deck.
> NL: Kader teaching-1 als het content.mjs dag-1-pakket (intent → bewijs), niet het volledige 78-slide importer-deck.

## Slide: Opportunity map

```yaml
kicker: Concept
type: concept
layout: steps
title: Opportunity / responsibility map
steps:
  - "Current task — what happens today without AI?"
  - "Desired task — what should a fresh reader be able to do?"
  - "One decision AI must not take alone"
expected: "A shared north star with one explicit human gate"
```

> notes:
> EN: From L1-INTENT in server/content.mjs. Keep language plain; do not invent Worldline KPIs.
> NL: Uit L1-INTENT in server/content.mjs. Houd taal gewoon; verzin geen Worldline-KPI’s.

## Slide: Practice — write the intent

```yaml
kicker: Practice
type: practice
layout: exercise
title: Write one shared intent for Atlas onboarding
timer: 15
assignment:
  title:
    en: Shared intent for Atlas onboarding
    nl: Gedeelde intent voor Atlas-onboarding
  timer: 15
  starterPath: teaching/day-1/starter
  steps:
    - en: "Open training-lab/teaching/day-1/starter/README.md (read-only first)"
      nl: "Open training-lab/teaching/day-1/starter/README.md (eerst read-only)"
    - en: "Write Problem / Desired result / Success criteria / Boundaries"
      nl: "Schrijf Probleem / Gewenst resultaat / Succescriteria / Grenzen"
    - en: "Name one decision AI must not take alone"
      nl: "Noem één beslissing die AI niet zelfstandig neemt"
    - en: "Mark unknowns as OPEN — do not invent missing files"
      nl: "Markeer onbekenden als OPEN — verzin geen ontbrekende bestanden"
  expected: "A short intent a second participant can restate without tools"
  check: "Four sections present; one human gate named; Atlas/fiction acknowledged"
  hints:
    - en: "Start from content.mjs initialDocument structure — problem before solution"
      nl: "Begin vanuit de content.mjs initialDocument-structuur — probleem vóór oplossing"
    - en: "Broad goals like 'make onboarding better' fail the check — bound them"
      nl: "Ruime doelen als 'onboarding verbeteren' falen de check — begrens ze"
```

> notes:
> EN: Collect intents before scout. Compare against day-1 worked example in content.mjs.
> NL: Verzamel intents vóór scout. Vergelijk met het day-1 worked example in content.mjs.
