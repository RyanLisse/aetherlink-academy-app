---
lesson: business-cases
day: support-5
course: worldline-wave-2
mode: solo
durationMinutes: 30
title:
  en: Business cases and datasets
  nl: Businesscases en datasets
lede:
  en: Every case has a one-paragraph brief plus a dataset or mock endpoint under day-05.
  nl: Elke case heeft een briefing van één alinea plus een dataset of mock-endpoint onder day-05.
---

## Slide: Five fictional cases

```yaml
kicker: Cases
type: concept
layout: cards
title: Five fictional cases (pick one)
cards:
  - title: CASE-FIC-501 Settlement
    body: Ledger vs PSP rows — explain mismatches before human review
  - title: CASE-FIC-502 Runbook assistant
    body: Answer only from runbook.md — cite the section
  - title: CASE-FIC-503 Transaction monitor
    body: CSV or mock-api — Risk / Reason / Recommended action drafts
  - title: CASE-FIC-504 · CASE-FIC-505
    body: Alert-draft test checklist · ops dashboard sketch on metrics.csv
```

> notes:
> EN: Briefs live in data/cases.json. Map your shape onto a case — do not invent live Worldline KPIs.
> NL: Briefs staan in data/cases.json. Koppel je vorm aan een case — verzin geen live Worldline-KPI's.

## Slide: Dataset or mock — always local

```yaml
kicker: Lab
type: concept
layout: steps
title: Dataset or mock — always local
steps:
  - "cases.json → brief + dataset path (+ optional mockEndpoint)"
  - "node starter/challenge.mjs list"
  - "node starter/challenge.mjs validate CASE-FIC-5xx"
  - "CASE-FIC-503 mock: node mock-api/server.mjs → :48140"
expected: "Chosen case validates; fiction markers intact"
```

> notes:
> EN: Mock is 127.0.0.1 only. No credentials. No remote PSP.
> NL: Mock is alleen 127.0.0.1. Geen credentials. Geen remote PSP.

## Slide: Practice — validate your case

```yaml
kicker: Practice
type: practice
layout: exercise
title: Validate one case and paste its brief
timer: 12
assignment:
  title:
    en: Case card — brief + dataset
    nl: Casekaart — briefing + dataset
  timer: 12
  starterPath: day-05/starter
  steps:
    - en: "Run node training-lab/day-05/starter/challenge.mjs list"
      nl: "Run node training-lab/day-05/starter/challenge.mjs list"
    - en: "Validate your CASE-FIC-5xx and open its dataset (or start mock-api)"
      nl: "Valideer je CASE-FIC-5xx en open de dataset (of start mock-api)"
    - en: "Paste the one-paragraph brief into your notes"
      nl: "Plak de briefing van één alinea in je notities"
  expected: "validate OK JSON; brief pasted; dataset or mock reachable"
  check: "Case id matches cases.json; fictional true; no live PSP"
  hints:
    - en: "Hint: CASE-FIC-503 needs mock-api OR transactions.csv — either is enough"
      nl: "Hint: CASE-FIC-503 heeft mock-api OF transactions.csv — één van beide volstaat"
```

> notes:
> EN: If someone skipped in lesson 1, they can sit out — access preserved.
> NL: Wie in les 1 overgeslagen heeft, mag stilzitten — toegang behouden.
