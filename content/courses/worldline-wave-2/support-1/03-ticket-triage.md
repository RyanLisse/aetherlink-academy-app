---
lesson: ticket-triage
day: support-1
course: worldline-wave-2
mode: solo
durationMinutes: 50
title:
  en: Challenge — fictional ticket triage
  nl: Challenge — fictieve ticket-triage
lede:
  en: Adapt the upstream support-triage workflow. Coordinator + Customer Reply + Risk specialists. Draft route only.
  nl: Pas de upstream support-triage workflow aan. Coordinator + Customer Reply + Risk. Alleen draft-route.
source:
  repo: RyanLisse/aetherlink-agent-lab
  commit: 765d99a656ac34005b9be53bdfb5daf7878b810a
  path: n8n/workflows/support-triage.json + scenarios/support-triage/
---

## Slide: Challenge brief

```yaml
kicker: Context
type: context
layout: pillars
title: End challenge — WL-1026 triage draft
items:
  - label: Input
    caption: Fictional ticket WL-1026 · Maarten · charged twice
  - label: Specialists
    caption: Customer Reply Agent + Risk Agent (tools)
  - label: Route
    caption: Switch → Low / Medium / High Priority Action (draft)
  - label: Gate
    caption: Human reviews draft — no customer send
```

> notes:
> EN: Starter is adapted from tip-vendored upstream; known export gaps (ticket_id in final prompt, uppercase labels) are teaching points — do not silently “fix” them away.
> NL: Starter is aangepast van tip-vendored upstream; bekende export-gaten zijn lesstof — niet stilzwijgend “wegfixen”.

## Slide: Success checks

```yaml
kicker: Concept
type: concept
layout: steps
title: What good evidence looks like
steps:
  - "Both specialist tool calls visible in the execution"
  - "Priority maps to a draft action branch"
  - "risk_note / customer_reply treated as draft text"
  - "Record model/provider/access mode in your run note"
  - "Leave OPEN anything not actually observed"
```

> notes:
> EN: Optional local checker: python3 training-lab/upstream/.../check_support_triage.py (shape only).
> NL: Optionele lokale checker: python3 …/check_support_triage.py (alleen shape).

## Slide: Practice — support-triage.json

```yaml
kicker: Practice
type: practice
layout: exercise
title: Complete one triage draft with evidence
timer: 30
assignment:
  title:
    en: Ticket triage challenge
    nl: Ticket-triage challenge
  timer: 30
  starterPath: day-01/starter
  steps:
    - en: Import support-triage.json
      nl: Importeer support-triage.json
    - en: Select model credentials on all three OpenAI Chat Model nodes (UI only)
      nl: Kies model-credentials op alle drie OpenAI Chat Model-nodes (alleen UI)
    - en: Execute once on Ticket Input WL-1026
      nl: Voer één keer uit op Ticket Input WL-1026
    - en: Inspect Customer Reply Agent and Risk Agent intermediate calls
      nl: Inspecteer Customer Reply Agent- en Risk Agent-tussenstappen
    - en: Save execution JSON or screenshot + a one-line human review (PASS / REVISE / OPEN)
      nl: Bewaar execution JSON of screenshot + één regel human review (PASS / REVISE / OPEN)
  expected: "Draft triage JSON with priority branch; both specialists called; no outbound send node"
  check: "Execution log shows AI Agent → specialists → Code → Switch → * Priority Action"
  hints:
    - en: "Clear static memory keys between tickets if the store persists (keys 1/2 in the export)"
      nl: "Wis statische memory-keys tussen tickets als de store blijft bestaan (keys 1/2 in de export)"
    - en: "UPPERCASE action labels in the export are OPEN observations vs the lowercase Claude contract"
      nl: "UPPERCASE action-labels in de export zijn OPEN-observaties t.o.v. het lowercase Claude-contract"
```

> notes:
> EN: Review slide next — participants show evidence, not vibes.
> NL: Review-slide hierna — deelnemers tonen bewijs, geen vibes.
