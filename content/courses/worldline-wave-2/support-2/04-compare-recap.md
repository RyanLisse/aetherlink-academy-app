---
lesson: compare-recap
day: support-2
course: worldline-wave-2
mode: guided
durationMinutes: 25
title:
  en: Compare n8n → Eve → SDK · takeaways
  nl: Vergelijk n8n → Eve → SDK · meeneem-punten
lede:
  en: Close the day by comparing runtimes and locking what transfers to work.
  nl: Sluit de dag af met een runtime-vergelijking en wat je meeneemt naar werk.
---

## Slide: Compare n8n → Eve → SDK

```yaml
kicker: Compare
type: concept
layout: compare
title: Compare n8n → Eve → Agent SDK
columns:
  - title: n8n (day 1)
    items:
      - "Visual nodes + Webhook"
      - "HTTP Get Weather tool"
      - "IF Decision → Draft Message"
  - title: Eve (guided)
    items:
      - "Agent as directory"
      - "Pinned eve@0.64.1"
      - "Same decision helper"
  - title: Agent SDK (solo)
    items:
      - "Code-first tools + skills"
      - "Day-1 n8n as MCP tool"
      - "Sub-agents for extend"
```

> notes:
> EN: Emphasise identical step names and fixture — platforms change, contract does not.
> NL: Benadruk identieke stapnamen en fixture — platforms wisselen, contract blijft.

## Slide: Recap — take to work

```yaml
kicker: Recap
type: recap
layout: recap
title: What do you take to work?
items:
  - label: Name the steps
    caption: Keep Get Weather / Weather Agent / IF Decision / Draft Message stable
  - label: Pin betas
    caption: Eve pin + plan-B recording path before live workshops
  - label: One test
    caption: Shared weather-agent.test.* across runtimes
  - label: Human gate
    caption: Draft ≠ send — still true in code agents
```

> notes:
> EN: Optional deepening: mastra/ and adk-go/ READMEs only.
> NL: Optionele verdieping: alleen mastra/ en adk-go/ READMEs.

## Slide: Practice — day-2 handoff

```yaml
kicker: Practice
type: practice
layout: exercise
title: Write a day-2 handoff note
timer: 10
assignment:
  title:
    en: Day-2 handoff note
    nl: Dag-2 handoff-notitie
  timer: 10
  starterPath: day-02/starter
  steps:
    - en: "List which path you proved (Eve / Agent SDK / both)"
      nl: "Noteer welk pad je bewees (Eve / Agent SDK / beide)"
    - en: "Paste shared test output snippet (decision line)"
      nl: "Plak shared-test output-snippet (decision-regel)"
    - en: "State Eve pin checked (0.64.1) or OPEN"
      nl: "Noteer Eve-pin gecontroleerd (0.64.1) of OPEN"
    - en: "Plan-B video: OPEN or path if media arrived"
      nl: "Plan-B video: OPEN of pad als media er is"
    - en: "One transfer note for your team (human gate)"
      nl: "Eén transfer-notitie voor je team (human gate)"
  expected: "Readable handoff another teammate can reproduce from day-02/"
  check: "Five lines; no secrets; shared decision cited"
  hints:
    - en: "If plan-B mp4 404s, write OPEN explicitly — that is correct until Ryan media lands the file"
      nl: "Als plan-B mp4 404 geeft, schrijf expliciet OPEN — dat is correct tot Ryan media het bestand zet"
```

> notes:
> EN: Collect handoffs; leave Linear copy ACCEPT to AetherLink.
> NL: Verzamel handoffs; Linear copy ACCEPT blijft bij AetherLink.
