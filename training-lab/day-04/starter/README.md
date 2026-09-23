# Day 4 starter — fraud signal analyzer

Fictional Reconciliation training only. No live PSP / Worldline KPIs.

## Files

| File | Role |
| --- | --- |
| `analyze.mjs` | `analyzeTransaction(row)` → `{ risk, reason, recommendedAction }` |
| `run.mjs` | CLI over `../data/transactions.csv` |

## Required output format

```text
TX-FIC-430: high / new device with high amount / human review
```

Shape: **Risk / Reason / Recommended action**.

## Commands

```bash
node ../data/generate.mjs
node run.mjs
node --test ../tests/*.test.mjs
```

Tooling is free for the challenge (n8n, agent, or script). Evidence goes via the Academy app or MCP — see support-4 lesson 04.
