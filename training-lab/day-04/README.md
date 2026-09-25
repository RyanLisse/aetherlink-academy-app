# Day 4 · AI Data Challenge — fraud signals

Analyze the generated fictional `transactions.csv` (amount, time, region, merchant, payment method, device, history). The generator uses a **fixed seed** (`SEED=20260921`); regenerating yields an identical file (hash pinned in `tests/expected.json`).

Each result must use: **Risk / Reason / Recommended action**.

## Layout

| Path | Role |
| --- | --- |
| `data/generate.mjs` | Seeded generator (committed) |
| `data/transactions.csv` | Generated fictional cohort + seeded suspicious rows |
| `starter/` | `analyze.mjs` + CLI `run.mjs` |
| `tests/expected.json` | Seeded suspicious IDs + CSV sha256 |
| `tests/reference-solution.mjs` | Finds every seeded case; reports FP count |
| `tests/fraud-dataset.test.mjs` | Determinism + reference + format |

## Facilitator comparison (manual — no auto-grade)

1. Fraud found  
2. False positives  
3. Explanation  
4. Simplicity  
5. Efficiency  
6. Creativity  

Evidence submission: Academy app assignment card **or** MCP — see `content/courses/worldline-wave-2/support-4/04-compare-evidence.md`.

## Commands

```bash
node data/generate.mjs
node starter/run.mjs
node --test tests/*.test.mjs
node tests/reference-solution.mjs
```

**Fictional Reconciliation** — drafts for human review only; no live PSP / Worldline KPIs.
