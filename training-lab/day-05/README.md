# Day 5 · AI Application Challenge (optional)

Choose one fictional business case, work **solo or as a duo**, and hand off a small agent, workflow, analysis tool, dashboard, AI service, knowledge assistant, test assistant, or transaction monitor.

**This day is optional.** Skipping it **preserves access and progress** on Wave 2 — you lose nothing by not joining.

## Layout

| Path | Role |
| --- | --- |
| `data/cases.json` | Business cases — one-paragraph brief each |
| `data/*.csv` / `*.md` / `*.json` | Fictional datasets |
| `mock-api/` | Local transactions mock for CASE-FIC-503 |
| `starter/challenge.mjs` | List / validate cases |
| `starter/handoff-template.md` | Squad-room handoff (Proof or file) |
| `tests/cases.test.mjs` | Every case has dataset or mock + brief |

## Commands

```bash
node starter/challenge.mjs list
node starter/challenge.mjs validate CASE-FIC-501
node mock-api/server.mjs   # CASE-FIC-503
node --test tests/*.test.mjs
```

Course pack: `content/courses/worldline-wave-2/support-5/`  
Terminology: **Fictional Reconciliation** · drafts only · human gate · no live PSP / Worldline KPIs.
