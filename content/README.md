# Academy content (interim v2)

Markdown lessons under `content/courses/<course>/<day>/`. Importers (AET-22) will
consume this tree; until then, follow the frontmatter below. Do not invent
Worldline KPIs or live case facts — use training-lab fixtures and product-reviewed copy.

## Lesson frontmatter

```yaml
---
lesson: weather-agent
day: support-1
course: worldline-wave-2
mode: guided   # guided | solo | squad
durationMinutes: 45
title:
  en: Weather agent in n8n
  nl: Weer-agent in n8n
---
```

## Slide blocks

Each `## Slide` heading is one deck card. Required fields:

- `type`: `context` | `concept` | `practice` | `review` | `recap` | `pause`
- Optional: `kicker`, `layout`, `timer`, `items`, `steps`, `expected`, `check`
- Facilitator notes: a `> notes:` block (EN+NL allowed in notes/cards/hints)
- **Slides body text: English only.** Cards, notes, and hints: EN + NL.

Every lesson **must** declare `mode` and **must end** in a `type: practice` slide
that embeds or links an assignment.

## Assignment frontmatter (inside practice)

```yaml
assignment:
  title:
    en: Import and run the weather agent
    nl: Importeer en run de weer-agent
  timer: 25
  starterPath: day-01/starter
  steps:
    - en: Start training-lab mocks
      nl: Start de training-lab mocks
  expected: "Amsterdam 2026-09-21 → bring umbrella; draft_only true"
  check: "n8n execution shows Get Weather → IF Decision → Draft Message"
  hints:
    - en: Keep weatherBaseUrl on the mock host
      nl: Houd weatherBaseUrl op de mock-host
```

`starterPath` is relative to `training-lab/` and must point at an existing folder.
