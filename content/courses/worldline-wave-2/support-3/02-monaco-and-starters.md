---
lesson: monaco-and-starters
day: support-3
course: worldline-wave-2
mode: solo
durationMinutes: 40
title:
  en: Monaco warm-up and starters
  nl: Monaco warm-up en starters
lede:
  en: Tiny transform in Monaco, then open the TS and Go starters.
  nl: Kleine transform in Monaco, daarna de TS- en Go-starters openen.
---

## Slide: Monaco warm-up

```yaml
kicker: Warm-up
type: concept
layout: code
title: Monaco warm-up — severity transform
language: typescript
code: |
  // Complete the function. Threshold matches the lab: 9000 EUR.
  export function toSeverity(amountEur: number): "high" | "low" {
    return amountEur >= 9000 ? "high" : "low";
  }
expected: "toSeverity(12500) === \"high\"; toSeverity(1200) === \"low\""
```

> notes:
> EN: Optional in-browser Monaco slide. If the classroom host lacks Monaco, use the same snippet in the starter TS file.
> NL: Optionele Monaco-slide. Zonder Monaco: zelfde snippet in de TS-starter.

## Slide: TS starter · Go starter

```yaml
kicker: Concept
type: concept
layout: compare
title: TS starter · Go starter
columns:
  - title: TypeScript
    items:
      - "starter/transaction-alert.ts"
      - "Typed AlertDraft + runAgainstMock"
      - "Mirrors transaction-alert.mjs"
  - title: Go
    items:
      - "starter/transaction-alert.go"
      - "go run . with MOCK_API_URL"
      - "Same draft JSON shape"
```

> notes:
> EN: Learners pick one language for the deploy evidence; both must pass tests/.
> NL: Deelnemers kiezen één taal voor deploy-bewijs; beide moeten tests/ halen.

## Slide: Practice — run one starter against the mock

```yaml
kicker: Practice
type: practice
layout: exercise
title: Produce the seeded alert draft
timer: 18
assignment:
  title:
    en: Starter vs mock — TX-FIC-302 draft
    nl: Starter vs mock — TX-FIC-302 draft
  timer: 18
  starterPath: day-03/starter
  steps:
    - en: "Keep mock running on :48139"
      nl: "Houd de mock draaiend op :48139"
    - en: "Run node transaction-alert.mjs OR go run transaction-alert.go"
      nl: "Run node transaction-alert.mjs OF go run transaction-alert.go"
    - en: "Confirm alert true / severity high / draft_only true"
      nl: "Bevestig alert true / severity high / draft_only true"
  expected: "JSON draft for TX-FIC-302 with human_approval_required true"
  check: "reason mentions fictional review threshold; no production send"
  hints:
    - en: "If go run fails on module path, run from starter/ where go.mod lives"
      nl: "Als go run faalt op modulepad, run vanuit starter/ waar go.mod staat"
```

> notes:
> EN: One hint only — solo day. Point at tests/ if stuck.
> NL: Slechts één hint — solo-dag. Verwijs naar tests/ bij vastlopen.
