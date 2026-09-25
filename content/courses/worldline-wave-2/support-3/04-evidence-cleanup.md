---
lesson: evidence-cleanup
day: support-3
course: worldline-wave-2
mode: guided
durationMinutes: 25
title:
  en: Evidence check and cleanup
  nl: Bewijscheck en opruimen
lede:
  en: Verify URL + alert, then clean up and name what transfers to work.
  nl: Verifieer URL + alert, ruim op, en benoem wat meegaat naar werk.
---

## Slide: Evidence check (URL + alert)

```yaml
kicker: Review
type: review
layout: cards
title: Evidence check (URL + alert)
cards:
  - title: Service URL
    body: Participant host + port serving /alert
  - title: Alert body
    body: TX-FIC-302 · alert true · draft_only true
  - title: Dataset
    body: Card download → day-03/data/transactions.json
```

> notes:
> EN: Mark missing URL or missing draft as OPEN — do not invent Cloud proof.
> NL: Ontbrekende URL of draft = OPEN — verzin geen Cloud-bewijs.

## Slide: Cleanup + what transfers to work

```yaml
kicker: Recap
type: recap
layout: recap
title: Cleanup + what transfers to work
items:
  - label: Stop your container
    caption: compose -p trainee-$USER down (infra owns shared teardown)
  - label: Boundary
    caption: input → AI → logic → draft — human gate stays
  - label: Fiction
    caption: Training fixtures ≠ production PSP feeds
  - label: Tomorrow
    caption: Carry the draft discipline into squad work
```

> notes:
> EN: Remind operators that teardown scripts live on the infra ticket, not in this pack.
> NL: Herinner operators: teardown-scripts horen bij het infra-ticket, niet bij dit pack.

## Slide: Practice — submit evidence pack

```yaml
kicker: Practice
type: practice
layout: exercise
title: Hand in URL + alert + cleanup note
timer: 10
assignment:
  title:
    en: Day-3 evidence pack
    nl: Dag-3 bewijspakket
  timer: 10
  starterPath: day-03/starter
  steps:
    - en: "Paste service URL"
      nl: "Plak service-URL"
    - en: "Paste one alert JSON (TX-FIC-302)"
      nl: "Plak één alert-JSON (TX-FIC-302)"
    - en: "State language used (TS / Go / Node serve)"
      nl: "Noteer gebruikte taal (TS / Go / Node serve)"
    - en: "Confirm container stopped or note OPEN if shared host"
      nl: "Bevestig container gestopt of noteer OPEN bij shared host"
  expected: "URL + alert + language + cleanup status; no secrets"
  check: "draft_only acknowledged; fictional framing intact"
  hints:
    - en: "If you only ran node --test, say so — still attach the JSON draft from the test output"
      nl: "Als je alleen node --test runde, zeg dat — plak nog steeds de JSON-draft uit de testoutput"
```

> notes:
> EN: Collect packs before break. Ping AetherLink for copy ACCEPT separately.
> NL: Verzamel packs vóór de pauze. Ping AetherLink apart voor copy ACCEPT.
