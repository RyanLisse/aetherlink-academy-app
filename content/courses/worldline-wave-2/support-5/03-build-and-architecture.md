---
lesson: build-and-architecture
day: support-5
course: worldline-wave-2
mode: solo
durationMinutes: 45
title:
  en: Build and architecture reading
  nl: Bouwen en architectuurlezen
lede:
  en: Build a small draft against your case; skim agent-native chat as an architecture example.
  nl: Bouw een kleine draft op je case; skim agent-native chat als architectuurvoorbeeld.
---

## Slide: Build for human review

```yaml
kicker: Build
type: concept
layout: pillars
title: Build for human review
items:
  - label: Input
    caption: Only the committed dataset or day-05 mock
  - label: Draft
    caption: Explainable output a teammate can re-run
  - label: Gate
    caption: Explicit human review stop — no live action
```

> notes:
> EN: Prefer boring clarity over clever fog. Duo = driver/navigator light until squad room.
> NL: Liever saaie helderheid dan slimme mist. Duo = licht driver/navigator tot de squad room.

## Slide: Architecture reading — agent-native chat

```yaml
kicker: Reading
type: concept
layout: steps
title: Architecture reading — agent-native chat template
steps:
  - "Open https://github.com/BuilderIO/agent-native/tree/main/templates/chat"
  - "Skim as a shape reference for agent ↔ tool ↔ human loops"
  - "Do not deploy the upstream template as-is in this classroom"
  - "Borrow ideas only — Academy stays Fictional Reconciliation + Proof handoff"
expected: "One borrowed idea named; no upstream secrets or live deploy"
```

> notes:
> EN: Link-only reading example for architecture. Not a product dependency for day 5.
> NL: Alleen-link leesvoorbeeld voor architectuur. Geen productafhankelijkheid voor dag 5.

## Slide: Practice — produce a draft sample

```yaml
kicker: Practice
type: practice
layout: exercise
title: Produce a draft sample for your case
timer: 25
assignment:
  title:
    en: Draft sample — explainable output
    nl: Draft-voorbeeld — uitlegbare output
  timer: 25
  starterPath: day-05/starter
  steps:
    - en: "Build a minimal draft against your validated case (script, n8n, or agent)"
      nl: "Bouw een minimale draft op je gevalideerde case (script, n8n of agent)"
    - en: "Capture 2–5 sample output lines (or screenshots of the sketch)"
      nl: "Leg 2–5 voorbeeldregels vast (of screenshots van de sketch)"
    - en: "Note one idea from the agent-native chat template reading (or N/A if skipped)"
      nl: "Noteer één idee uit de agent-native chat-template-lezing (of N/A bij skip)"
    - en: "Confirm the human gate line exists in the draft or notes"
      nl: "Bevestig dat de human-gate-regel in de draft of notities staat"
  expected: "Sample lines + human gate + optional architecture note; fiction intact"
  check: "Output re-runnable or explainable; no live PSP / secrets"
  hints:
    - en: "Hint: settlement mismatches → show arithmetic delta + SET-FIC-* id"
      nl: "Hint: settlement-mismatches → toon rekenkundige delta + SET-FIC-*-id"
    - en: "Hint: knowledge assistant → quote the runbook section title"
      nl: "Hint: knowledge assistant → citeer de runbook-sectietitel"
```

> notes:
> EN: Time-box build. Perfect is the enemy of a handoffable draft.
> NL: Time-box de build. Perfect is de vijand van een overdraagbare draft.
