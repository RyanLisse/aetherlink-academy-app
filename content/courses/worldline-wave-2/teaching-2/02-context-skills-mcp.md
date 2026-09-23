---
lesson: context-skills-mcp
day: teaching-2
course: worldline-wave-2
mode: guided
durationMinutes: 25
title:
  en: Context, skills, and MCP information boundaries
  nl: Context, skills en MCP-informatiegrenzen
lede:
  en: Context fuels the current task. Skills package methods. MCP exposes tools — permissions still bound access.
  nl: Context voedt de huidige taak. Skills verpakken werkwijzen. MCP ontsluit tools — permissies begrenzen toegang.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 + server/content.mjs L2-CONTEXT / L2-SKILLS / L2-MCP / L2-PERMISSIONS
  note: Adapted from content.mjs L2 lessons; wave-2 MCP path uses training-lab mocks (see lesson 03).
---

## Slide: Context layers

```yaml
kicker: Concept
type: concept
layout: cards
title: Where durable context lives
cards:
  - title: CLAUDE.md
    body: Durable project agreements — not secrets
  - title: References
    body: Longer explanations in findable docs
  - title: Handoff
    body: Progress for the next owner
  - title: Never
    body: Shared secrets or unapproved tokens
```

> notes:
> EN: L2-CONTEXT. Fresh-session test — can another person recover goal, decision, evidence, next step?
> NL: L2-CONTEXT. Fresh-session test — kan een ander doel, besluit, bewijs en volgende stap terugvinden?

## Slide: Skill vs MCP vs permission

```yaml
kicker: Concept
type: concept
layout: compare
title: Capability map
columns:
  - title: Skill
    items:
      - "Reusable method for one task type"
      - "Does not grant system access by itself"
  - title: MCP
    items:
      - "Exposes tools and information to an agent"
      - "Room/token still bound what is allowed"
  - title: Human gate
    items:
      - "Decide read / propose / execute"
      - "Stop on secrets, missing access, out-of-scope work"
```

> notes:
> EN: L2-SKILLS / L2-MCP / L2-PERMISSIONS. A room token is not an Anthropic API key. Game cannot remotely start Claude Code.
> NL: L2-SKILLS / L2-MCP / L2-PERMISSIONS. Een kamertoken is geen Anthropic API-key. De game kan Claude Code niet op afstand starten.

## Slide: Practice — capability map for Assignment 10

```yaml
kicker: Practice
type: practice
layout: exercise
title: Map context · skill · tool · human judgement
timer: 10
assignment:
  title:
    en: Capability map before connected context
    nl: Capability-map vóór connected context
  timer: 10
  starterPath: teaching/assignment-10
  steps:
    - en: "List context you will use (mcp.json URLs, fixture README)"
      nl: "Noteer welke context je gebruikt (mcp.json-URL’s, fixture README)"
    - en: "Name the MCP tools you expect (list/get) — read-only"
      nl: "Noem de MCP-tools die je verwacht (list/get) — read-only"
    - en: "Name one action a real connection could do that you will not approve"
      nl: "Noem één actie die een echte verbinding zou kunnen doen die je niet goedkeurt"
    - en: "State the human gate before any write-shaped tool"
      nl: "Noem de menselijke gate vóór elke write-achtige tool"
  expected: "One-page map: context / instruction / tool / skill / human judgement"
  check: "Read-only intent explicit; at least one refused write action named"
  hints:
    - en: "Primary servers are training-jira / training-gitlab / training-confluence on 127.0.0.1"
      nl: "Primaire servers zijn training-jira / training-gitlab / training-confluence op 127.0.0.1"
```

> notes:
> EN: Prep for Assignment 10. Decision 3 originally preferred live Worldline MCP; wave-2 uses mocks outside Worldline.
> NL: Voorbereiding op Assignment 10. Decision 3 verkoos oorspronkelijk live Worldline-MCP; wave-2 gebruikt mocks buiten Worldline.
