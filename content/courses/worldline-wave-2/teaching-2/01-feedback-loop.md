---
lesson: feedback-loop
day: teaching-2
course: worldline-wave-2
mode: guided
durationMinutes: 30
title:
  en: Intent → plan → change → test → review → handoff
  nl: Intent → plan → wijziging → test → review → handoff
lede:
  en: Practise one small controlled change. Context, tools, and human decisions stay visible.
  nl: Oefen één kleine gecontroleerde wijziging. Context, tools en menselijke beslissingen blijven zichtbaar.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 + server/content.mjs day2Pack feedbackLoop
  note: Adapted from content.mjs day pack 2; importers own the 78-slide deck.
---

## Slide: Six visible steps

```yaml
kicker: Concept
type: concept
layout: steps
title: Feedback loop
steps:
  - "Intent — which problem and which evidence counts?"
  - "Plan — smallest change and how we will check it"
  - "Change — one reversible step"
  - "Test — which local control was actually run?"
  - "Review — human PASS / REVISE / OPEN on evidence"
  - "Handoff — what a fresh reader needs and who owns next"
expected: "All six steps visible with concrete observations"
```

> notes:
> EN: Worked example from content.mjs — README vs package.json, one doc fix, node --test, fresh reader, human decision.
> NL: Worked example uit content.mjs — README vs package.json, één doc-fix, node --test, verse lezer, menselijk besluit.

## Slide: Practice — one controlled improvement

```yaml
kicker: Practice
type: practice
layout: exercise
title: ATLAS-FEEDBACK-02 — one controlled improvement
timer: 25
assignment:
  title:
    en: One controlled Atlas improvement
    nl: Eén gecontroleerde Atlas-verbetering
  timer: 25
  starterPath: teaching/day-2/starter
  steps:
    - en: "Write intent + plan before editing any file"
      nl: "Schrijf intent + plan vóór je een bestand wijzigt"
    - en: "Apply one small reversible README (or docs) correction in your copy of day-1 starter"
      nl: "Pas één kleine omkeerbare README- (of docs-)correctie toe in je kopie van de day-1 starter"
    - en: "Run the local check and paste command + output"
      nl: "Voer de lokale check uit en plak commando + uitvoer"
    - en: "Record reviewer decision PASS / REVISE / OPEN and next owner"
      nl: "Noteer reviewerbesluit PASS / REVISE / OPEN en volgende eigenaar"
  expected: "Six loop steps documented; rejected ideas stay OPEN — never invent results"
  check: "Intent, plan, change, test output, review decision, handoff owner all present"
  hints:
    - en: "Use teaching/day-1/starter as the files under change; day-2/starter holds the mission checklist JSON"
      nl: "Gebruik teaching/day-1/starter als te wijzigen bestanden; day-2/starter bevat de missie-checklist JSON"
    - en: "If the reviewer rejects, keep the rejection visible as OPEN — do not silently accept"
      nl: "Als de reviewer afwijst, houd de afwijzing zichtbaar als OPEN — accepteer niet stilzwijgend"
```

> notes:
> EN: Quiz answers from content.mjs: evidence = command+output+fresh reader; rejected → OPEN; refuse out-of-scope Jira.
> NL: Quizantwoorden uit content.mjs: bewijs = commando+uitvoer+verse lezer; afgewezen → OPEN; weiger Jira buiten scope.
