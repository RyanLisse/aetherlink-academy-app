---
lesson: review-recap
day: support-1
course: worldline-wave-2
mode: guided
durationMinutes: 25
title:
  en: Review and takeaways
  nl: Review en meeneem-punten
---

## Slide: Review submitted evidence

```yaml
kicker: Review
type: review
layout: cards
title: What did your execution prove?
cards:
  - title: Weather agent
    body: Mock fixture + IF branch + draft message
  - title: Rising steps
    body: Code priority + Switch + draft alert
  - title: Triage challenge
    body: Specialists visible + draft route + human gate
```

> notes:
> EN: Ask for execution IDs / screenshots. Mark missing evidence OPEN.
> NL: Vraag om execution-IDs / screenshots. Ontbrekend bewijs = OPEN.

## Slide: Recap — take to work

```yaml
kicker: Recap
type: recap
layout: recap
title: What do you take to work?
items:
  - label: Name the steps
    caption: Keep Get Weather / Weather Agent names stable across platforms
  - label: Draft ≠ send
    caption: Human approval is the gate for any customer-facing text
  - label: Evidence over claims
    caption: Execution log beats a confident summary
  - label: Tomorrow
    caption: Same weather contract in Eve (guided) and Claude Agent SDK (solo)
```

> notes:
> EN: Close with transfer to day-2 folders under training-lab/day-02/.
> NL: Sluit af met transfer naar day-02 mappen onder training-lab/day-02/.

## Slide: Practice — handoff note

```yaml
kicker: Practice
type: practice
layout: exercise
title: Write a 5-line handoff
timer: 10
assignment:
  title:
    en: Day-1 handoff note
    nl: Dag-1 handoff-notitie
  timer: 10
  starterPath: day-01/starter
  steps:
    - en: "List which starter JSON you ran (weather-agent / rising-steps / support-triage)"
      nl: "Noteer welke starter JSON je runde (weather-agent / rising-steps / support-triage)"
    - en: "Paste execution ID or screenshot path"
      nl: "Plak execution-ID of screenshot-pad"
    - en: "State model/provider/access mode actually used"
      nl: "Noteer model/provider/access mode die je echt gebruikte"
    - en: "Human review decision: PASS / REVISE / OPEN"
      nl: "Human review-besluit: PASS / REVISE / OPEN"
    - en: "One OPEN question for day 2"
      nl: "Eén OPEN vraag voor dag 2"
  expected: "Readable handoff another teammate can reproduce from day-01/starter"
  check: "Five lines present; no secrets; draft_only acknowledged"
  hints:
    - en: "If you only ran the mock HTTP path without n8n Cloud, say so explicitly (UNKNOWN Cloud)"
      nl: "Als je alleen het mock-HTTP-pad zonder n8n Cloud runde, zeg dat expliciet (UNKNOWN Cloud)"
```

> notes:
> EN: Collect handoffs before lunch break or end-of-block.
> NL: Verzamel handoffs vóór de lunchpauze of einde blok.
