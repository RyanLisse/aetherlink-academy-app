---
lesson: rising-steps
day: support-1
course: worldline-wave-2
mode: solo
durationMinutes: 40
title:
  en: Rising steps — Set, Code, Switch, draft alerts
  nl: Stijgende stappen — Set, Code, Switch, draft-alerts
lede:
  en: Process fictional ticket fields, decide low/medium/high, emit draft alerts, keep Get Weather as an optional external tool.
  nl: Verwerk fictieve ticketvelden, kies low/medium/high, maak draft-alerts, houd Get Weather als optionele externe tool.
---

## Slide: Why rising steps

```yaml
kicker: Concept
type: concept
layout: steps
title: From fields to a draft route
steps:
  - "Set — Ticket Input embeds fictional WL-1026"
  - "Code — derive priority / sentiment / recommended_action"
  - "Switch — branch low / medium / high"
  - "Draft alert Sets — auto_reply / investigate / escalate (draft only)"
  - "Get Weather — optional external tool (same name as the weather agent)"
```

> notes:
> EN: WL-1026 is synthetic from upstream support-triage fixtures. No live Jira.
> NL: WL-1026 is synthetisch uit upstream support-triage fixtures. Geen live Jira.

## Slide: Priority mapping

```yaml
kicker: Concept
type: concept
layout: cards
title: Deterministic priority map
cards:
  - title: low → auto_reply
    body: Draft self-service reply for human review
  - title: medium → investigate
    body: Draft investigation queue note
  - title: high → escalate
    body: Draft escalation alert — still not a real send
```

> notes:
> EN: Lowercase action labels match the Claude contract in scenarios/support-triage.
> NL: Lowercase action-labels matchen het Claude-contract in scenarios/support-triage.

## Slide: Practice — rising-steps.json

```yaml
kicker: Practice
type: practice
layout: exercise
title: Run rising-steps and read the draft alert
timer: 20
assignment:
  title:
    en: Rising steps — priority draft
    nl: Stijgende stappen — priority draft
  timer: 20
  starterPath: day-01/starter
  steps:
    - en: Import rising-steps.json into n8n
      nl: Importeer rising-steps.json in n8n
    - en: Execute once on the embedded WL-1026 Ticket Input
      nl: Voer één keer uit op de ingebedde WL-1026 Ticket Input
    - en: Confirm Code Priority → Switch → High Priority Action (escalate draft)
      nl: Bevestig Code Priority → Switch → High Priority Action (escalate draft)
    - en: Optional stretch — wire Get Weather as a tool on a later AI node (keep the name)
      nl: Optionele stretch — koppel Get Weather als tool op een latere AI-node (zelfde naam)
    - en: Export or screenshot the execution
      nl: Exporteer of screenshot de execution
  expected: "priority high, action escalate, draft_only true, human_approval_required true"
  check: "Execution path Ticket Input → Code Priority → Switch → High Priority Action"
  hints:
    - en: "Complaint + today + charged twice → high in the starter Code node"
      nl: "Complaint + today + charged twice → high in de starter Code-node"
    - en: "Do not add a Send Email / Slack node — alerts stay Set drafts"
      nl: "Voeg geen Send Email / Slack-node toe — alerts blijven Set-drafts"
```

> notes:
> EN: Solo build — facilitator circulates; collect execution IDs for the review slide.
> NL: Solo build — facilitator loopt rond; verzamel execution-IDs voor de review-slide.
