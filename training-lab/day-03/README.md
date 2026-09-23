# Day 3 · Transaction alert service

Build a small AI+cloud+code service that reads the **fictional** transactions mock,
scores a deviation (AI stub), applies a transparent threshold, and emits an
**alert draft** for a human gate. No live PSP.

| Path | Purpose |
| --- | --- |
| `mock-api/` | Seeded transactions HTTP API (`TX-FIC-302` deviation) |
| `data/transactions.json` | Fixture source of truth |
| `starter/` | TS + Go (+ Node reference) + Docker recipe |
| `tests/` | Both starters vs mock for seeded deviation |

```bash
node training-lab/day-03/mock-api/server.mjs
node --test training-lab/day-03/tests/*.test.mjs
```
