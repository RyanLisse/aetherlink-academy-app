---
lesson: extend-challenge
day: support-2
course: worldline-wave-2
mode: solo
durationMinutes: 40
title:
  en: Sub-agents compare and challenge
  nl: Sub-agents vergelijken en challenge
lede:
  en: Compare Analyst · Tester · Report roles, then build the most useful assistant for a fictional case.
  nl: Vergelijk Analyst · Tester · Report-rollen, bouw daarna de nuttigste assistent voor een fictieve case.
---

## Slide: Sub-agents compare

```yaml
kicker: Extend
type: concept
layout: compare
title: Sub-agents compare (Analyst · Tester · Report)
columns:
  - title: Data Analyst
    items:
      - "Reads weather fixture + fictional ticket fields"
      - "Summarises risk for human review"
      - "Folder: subagents/data-analyst/"
  - title: Tester
    items:
      - "Re-checks shared acceptance expectations"
      - "Flags drift from STEP-NAMES.md"
      - "Folder: subagents/tester/"
  - title: Report Generator
    items:
      - "Drafts a handoff report only"
      - "Never auto-sends or writes payments"
      - "Folder: subagents/report-generator/"
```

> notes:
> EN: Main agent remains Weather Agent; specialists are drafts for the facilitator to demo as compare layout.
> NL: Hoofdagent blijft Weather Agent; specialisten zijn drafts voor de facilitator als compare-layout.

## Slide: Optional — model difference

```yaml
kicker: Optional
type: concept
layout: compare
title: What changes with a different model?
columns:
  - title: Stable
    items:
      - "Get Weather HTTP contract"
      - "IF Decision threshold (≥60%)"
      - "draft_only + human gate"
  - title: Variable
    items:
      - "Wording of the draft message"
      - "Tool-call narration style"
      - "Latency / availability"
```

> notes:
> EN: Acceptance is the fixture decision — not prose style.
> NL: Acceptatie is de fixture-beslissing — niet de schrijfstijl.

## Slide: Challenge — most useful assistant

```yaml
kicker: Challenge
type: concept
layout: cards
title: Challenge — most useful assistant (fictional case)
cards:
  - title: Case
    body: "Fictional Reconciliation desk needs an umbrella+triage assistant for WL-1026-style tickets"
  - title: Constraint
    body: "Agent SDK only · reuse day-1 fiction · drafts only"
  - title: Evidence
    body: "Shared test still PASS; describe one sub-agent handoff"
```

> notes:
> EN: WL-1026 remains synthetic from day-1 fixtures — no live Jira.
> NL: WL-1026 blijft synthetisch uit dag-1 fixtures — geen live Jira.

## Slide: Practice — challenge build

```yaml
kicker: Practice
type: practice
layout: exercise
title: Sketch the most useful Agent SDK assistant
timer: 20
assignment:
  title:
    en: Challenge — useful assistant sketch
    nl: Challenge — schets nuttige assistent
  timer: 20
  starterPath: day-02/claude-agent-sdk
  steps:
    - en: "Pick one fictional goal (umbrella brief + triage draft for WL-1026 fields)"
      nl: "Kies één fictief doel (paraplu-brief + triage-draft voor WL-1026-velden)"
    - en: "Map main agent → Data Analyst → Tester → Report Generator"
      nl: "Map hoofdagent → Data Analyst → Tester → Report Generator"
    - en: "Keep Get Weather / IF Decision names; do not change the threshold"
      nl: "Houd Get Weather / IF Decision-namen; verander de drempel niet"
    - en: "Re-run day-02 weather tests to prove the contract still holds"
      nl: "Run day-02 weather-tests opnieuw om te bewijzen dat het contract houdt"
    - en: "Write a 5-line draft report for human review"
      nl: "Schrijf een 5-regelig draft-rapport voor human review"
  expected: "Sketch + PASS shared test + draft report with human_approval_required"
  check: "Sub-agent folders referenced; no secrets; decision still bring umbrella on fixture"
  hints:
    - en: "Optional Mastra / ADK Go folders are README-only — do not treat them as required lessons"
      nl: "Optionele Mastra / ADK Go-mappen zijn alleen README — geen verplichte lessen"
```

> notes:
> EN: Score usefulness by clarity of human gate, not model swagger.
> NL: Beoordeel nut op duidelijkheid van de human gate, niet op model-show.
