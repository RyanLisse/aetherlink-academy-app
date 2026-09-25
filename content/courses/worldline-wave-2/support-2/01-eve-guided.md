---
lesson: eve-guided
day: support-2
course: worldline-wave-2
mode: guided
durationMinutes: 50
title:
  en: Same agent, new runtime — Eve guided
  nl: Zelfde agent, nieuwe runtime — Eve begeleid
lede:
  en: Rebuild the day-1 weather agent as an Eve directory. Pin the Eve version; keep drafts only.
  nl: Bouw de dag-1 weer-agent opnieuw als Eve-directory. Pin de Eve-versie; alleen drafts.
source:
  repo: RyanLisse/aetherlink-academy-app
  path: training-lab/day-02/eve + day-01/STEP-NAMES.md
---

## Slide: Same agent, new runtime

```yaml
kicker: Support day 2 · bouw mee
type: context
layout: pillars
title: Same weather agent — new runtime
items:
  - label: Continuity
    caption: Reuse day-1 step names and Amsterdam fixture
  - label: Guided first
    caption: Facilitator builds in Eve; participants follow along
  - label: Human gate
    caption: Draft Message only — never auto-send
```

> notes:
> EN: Frame as Fictional Reconciliation. Point at STEP-NAMES.md before opening Eve.
> NL: Kader als Fictional Reconciliation. Wijs op STEP-NAMES.md vóór Eve.

## Slide: Eve guided — build along

```yaml
kicker: Concept
type: concept
layout: steps
title: Eve — agent as a directory
steps:
  - "Pin eve@0.64.1 from training-lab/day-02/eve/package.json"
  - "agent.ts + instructions.md = Weather Agent runtime + prompt"
  - "tools/get_weather.ts = Get Weather (mock HTTP contract)"
  - "skills/weather.md = IF Decision guidance (≥60% → bring umbrella)"
  - "Draft Message stays human-reviewed — draft_only true"
expected: "Directory mirrors day-1 node names without renaming"
```

> notes:
> EN: Do not install Eve into the Academy monorepo workspace — learner/VM only.
> NL: Installeer Eve niet in de Academy-monorepo — alleen op learner/VM.

## Slide: Plan-B if Eve flakes

```yaml
id: demo-fallback
kicker: Fallback
type: concept
layout: cards
title: Plan-B if Eve flakes
cards:
  - title: Recording
    body: "/academy-assets/support-2-eve-plan-b.mp4 (OPEN until Ryan media lands the file)"
  - title: Lab proof
    body: "Always runnable — pnpm --filter training-lab test (day-02 shared decision)"
  - title: Do not substitute
    body: "arcade-walkthrough-en.mp4 is the wrong surface — skip it"
```

> notes:
> EN: Link is honest: asset path is stubbed; BLOCKER tracks media. Prefer documenting OPEN over inventing footage.
> NL: Link is eerlijk: asset-pad is stub; BLOCKER volgt media. Liever OPEN documenteren dan footage verzinnen.

## Slide: Practice — Eve directory walk

```yaml
kicker: Practice
type: practice
layout: exercise
title: Open the Eve starter and prove the shared decision
timer: 25
assignment:
  title:
    en: Eve guided — pin + shared test
    nl: Eve begeleid — pin + gedeelde test
  timer: 25
  starterPath: day-02/eve
  steps:
    - en: "Read EVE-VERSION.md and confirm pin 0.64.1 in package.json"
      nl: "Lees EVE-VERSION.md en bevestig pin 0.64.1 in package.json"
    - en: "Skim agent.ts, instructions.md, tools/get_weather.ts, skills/weather.md"
      nl: "Bekijk agent.ts, instructions.md, tools/get_weather.ts, skills/weather.md"
    - en: "From repo: start mocks if needed, run day-02 weather tests"
      nl: "Vanuit de repo: start mocks indien nodig, run day-02 weather-tests"
    - en: "Confirm Amsterdam / 2026-09-21 → bring umbrella for Eve path"
      nl: "Bevestig Amsterdam / 2026-09-21 → bring umbrella voor Eve-pad"
    - en: "If Eve CLI/model is unavailable, record OPEN model run and keep the deterministic PASS"
      nl: "Als Eve CLI/model ontbreekt, noteer OPEN model-run en behoud deterministische PASS"
  expected: "Shared test PASS; Eve pin documented; draft_only acknowledged"
  check: "Evidence shows eve pin 0.64.1 + weather-agent.test decision bring umbrella"
  hints:
    - en: "Plan-B slide links /academy-assets/support-2-eve-plan-b.mp4 — expect 404 until media lands"
      nl: "Plan-B-slide linkt /academy-assets/support-2-eve-plan-b.mp4 — verwacht 404 tot media er is"
    - en: "Step names must stay identical to day-1 STEP-NAMES.md"
      nl: "Stapnamen blijven identiek aan day-1 STEP-NAMES.md"
```

> notes:
> EN: Collect pin confirmation + test output. Model-backed Eve is optional evidence.
> NL: Verzamel pin-bevestiging + testoutput. Model-backed Eve is optioneel bewijs.
