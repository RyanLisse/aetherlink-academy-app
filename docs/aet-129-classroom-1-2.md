# AET-129 — Classroom 1–2 authoring bar retrofit (P3)

**Linear:** [AET-129](https://linear.app/aetherlink/issue/AET-129) under [AET-116](https://linear.app/aetherlink/issue/AET-116)  
**ACCEPT:** `/workspace/handoffs/2026-09-29-academy-p3-classroom-w1-w2/PRODUCT-ACCEPT-P3.md`

## What shipped

| Day | Route | Diagram | ConceptSim | Mechanism cue |
|---|---|---|---|---|
| Classroom 1 | `/classroom/1` | `public/diagrams/classroom/c1-explore-plan-change-verify-commit.svg` | `content/sims/c1-agent-loop.json` | explore → plan → change → verify → commit |
| Classroom 2 | `/classroom/2` | `public/diagrams/classroom/c2-customize-stack.svg` | `content/sims/c2-customize-stack.json` | CLAUDE.md → skills → subagents → MCP/hooks |

Both day packs use the day-3 locale shape: `localeComplete:true`, `requireLocales:true`, `copy:{en,nl}`, `...nl` defaults, `sims:[…]`.

## Pedagogy keep

- Apple bar / Uitleg → Voordoen → Zelf doen
- Classroom 1 solos A1–A4 + mission CLASSROOM-01
- Classroom 2 solos A6–A13 + mission CLASSROOM-02
- Routes stay `/classroom/1` and `/classroom/2` (no Classroom→Workshop rename; no Harness cutover)
- `fixture-agent-loop` remains in `content/sims/` for surface proofs but is no longer the Classroom 1 bar sim

## Soft live

AetherLink stamps F0–F6 both locales after OpenShip. Herdr does not mark Linear Done.
