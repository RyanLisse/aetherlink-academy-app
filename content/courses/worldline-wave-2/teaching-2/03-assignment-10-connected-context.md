---
lesson: assignment-10-connected-context
day: teaching-2
course: worldline-wave-2
mode: solo
durationMinutes: 30
title:
  en: Assignment 10 — Connected context (mock MCP)
  nl: Assignment 10 — Connected context (mock-MCP)
lede:
  en: Retrieve one authorised fictional item read-only via training-lab MCP mocks. Plan-B local fixtures kept.
  nl: Haal één geautoriseerd fictief item read-only op via training-lab MCP-mocks. Plan-B lokale fixtures blijven.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 (Part 5 / Assignment 10) — wave-2 adapts primary path to training-lab/mocks/mcp-* outside Worldline; plan-B fixtures retained
  note: Rewritten for AET-41. Do not use live Worldline Jira/GitLab/Confluence. Importers own the 78-slide deck import.
---

## Slide: Approved training connections

```yaml
kicker: Concept
type: concept
layout: cards
title: Mock MCP servers (outside Worldline)
cards:
  - title: training-jira
    body: http://127.0.0.1:48136/mcp · list_issues / get_issue
  - title: training-gitlab
    body: http://127.0.0.1:48137/mcp · list_merge_requests / get_merge_request
  - title: training-confluence
    body: http://127.0.0.1:48138/mcp · search_pages / get_page
  - title: Plan-B
    body: teaching/assignment-10/fixtures/*.json if MCP is unreachable
```

> notes:
> EN: CURRICULUM decision 3 confirmed real Worldline MCP as original primary. Wave-2 teaching packs make mocks primary so the day runs outside Worldline; fixtures remain the safety net from the same decision.
> NL: CURRICULUM decision 3 bevestigde echte Worldline-MCP als oorspronkelijk primair. Wave-2 teaching-packs maken mocks primair zodat de dag buiten Worldline draait; fixtures blijven het vangnet uit dezelfde decision.

## Slide: Practice — Assignment 10

```yaml
kicker: Practice
type: practice
layout: exercise
title: Assignment 10 — Connected context
timer: 30
assignment:
  title:
    en: Retrieve one authorised item (read-only)
    nl: Haal één geautoriseerd item op (read-only)
  timer: 30
  starterPath: teaching/assignment-10
  steps:
    - en: "Start mocks: pnpm --filter training-lab start:mocks (from repo root, Node 24)"
      nl: "Start mocks: pnpm --filter training-lab start:mocks (vanuit repo-root, Node 24)"
    - en: "Copy teaching/assignment-10/mcp.json into your Claude Code MCP config (no secrets)"
      nl: "Kopieer teaching/assignment-10/mcp.json naar je Claude Code MCP-config (geen secrets)"
    - en: "In Claude Code run /mcp and confirm training-jira, training-gitlab, training-confluence"
      nl: "In Claude Code: /mcp en bevestig training-jira, training-gitlab, training-confluence"
    - en: "Choose one path — Jira TRAIN-101|102, GitLab IID 7|8, or Confluence PAGE-201 — read-only"
      nl: "Kies één pad — Jira TRAIN-101|102, GitLab IID 7|8, of Confluence PAGE-201 — read-only"
    - en: "Explain retrieved fields, what remains OPEN, and write-shaped actions you did not approve"
      nl: "Leg opgehaalde velden uit, wat OPEN blijft, en write-achtige acties die je niet goedkeurde"
    - en: "Plan-B only if MCP fails: explain one file under teaching/assignment-10/fixtures/ instead"
      nl: "Plan-B alleen als MCP faalt: leg één bestand onder teaching/assignment-10/fixtures/ uit"
  expected: "No external changes. Sourced plain-language explanation of one connected (or plan-B) item with OPEN points marked."
  check: "Screenshot or log shows MCP tool listing + one tool result (or explicit Plan-B fixture path); no writes"
  hints:
    - en: "Known tools: list_issues, get_issue, list_merge_requests, get_merge_request, search_pages, get_page"
      nl: "Bekende tools: list_issues, get_issue, list_merge_requests, get_merge_request, search_pages, get_page"
    - en: "Plan-B includes fixtures/jira-EX-142.json (classroom fallback) and jira-TRAIN-101.json (mock mirror)"
      nl: "Plan-B bevat fixtures/jira-EX-142.json (classroom-fallback) en jira-TRAIN-101.json (mock-spiegel)"
    - en: "Do not modify the mock servers or invent ticket fields"
      nl: "Wijzig de mock-servers niet en verzin geen ticketvelden"
```

> notes:
> EN: Highest infra-risk moment — verify mocks yourself before class. Teaching point survives on fixtures alone.
> NL: Hoogste infra-risico — verifieer mocks zelf vóór de klas. Het lespunt overleeft op fixtures alleen.
