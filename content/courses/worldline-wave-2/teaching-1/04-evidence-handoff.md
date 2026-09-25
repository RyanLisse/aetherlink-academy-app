---
lesson: evidence-handoff
day: teaching-1
course: worldline-wave-2
mode: guided
durationMinutes: 20
title:
  en: Evidence, review, and fresh-reader handoff
  nl: Bewijs, review en overdracht aan een verse lezer
lede:
  en: Separate claims from executed checks. A second participant must reproduce the control.
  nl: Scheid claims van uitgevoerde controles. Een tweede deelnemer moet de controle reproduceren.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 + server/content.mjs L2-EVIDENCE / L2-HANDOFF / day-1 reviewCriteria
  note: Adapted from content.mjs; importers own the 78-slide deck.
---

## Slide: Claim vs check

```yaml
kicker: Concept
type: concept
layout: compare
title: Claim versus executed check
columns:
  - title: Claim
    items:
      - "Agent summary alone"
      - "Everything works"
      - "Assumed token access"
  - title: Check
    items:
      - "Command + observed output"
      - "File reference + passage"
      - "Named limitation and next owner"
```

> notes:
> EN: A green check only proves what that check measures. Humans judge the conclusion.
> NL: Een groene check bewijst alleen wat die check meet. Mensen beoordelen de conclusie.

## Slide: Practice — handoff for a fresh reader

```yaml
kicker: Practice
type: practice
layout: exercise
title: Write a fresh-reader handoff
timer: 10
assignment:
  title:
    en: Teaching-1 handoff note
    nl: Teaching-1 handoff-notitie
  timer: 10
  starterPath: teaching/day-1/starter
  steps:
    - en: "Restate goal, decision, evidence (command+output), OPEN risks, next owner"
      nl: "Herhaal doel, besluit, bewijs (commando+uitvoer), OPEN-risico’s, volgende eigenaar"
    - en: "Have a navigator reproduce the check once"
      nl: "Laat een navigator de controle één keer reproduceren"
    - en: "Record PASS / REVISE / OPEN with reason"
      nl: "Noteer PASS / REVISE / OPEN met reden"
  expected: "Another participant can re-run the check with at most one hint"
  check: "Five fields present; navigator result recorded; no secrets"
  hints:
    - en: "Agent agreement is not an independent test — use a human navigator"
      nl: "Agentovereenstemming is geen onafhankelijke test — gebruik een menselijke navigator"
```

> notes:
> EN: Close day 1; tomorrow continues with the feedback loop and connected mock MCP.
> NL: Sluit dag 1; morgen verder met de feedbackloop en verbonden mock-MCP.
