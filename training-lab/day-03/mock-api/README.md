# Day 3 mock API — fictional transactions

HTTP fixture for the transaction-alert lab. **No live PSP.**

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/transactions` | All seeded rows (`?deviation=true` → seeded deviations only) |
| GET | `/transactions/:id` | One row (e.g. `TX-FIC-302`) |

Default listen: `127.0.0.1:48139` (`PORT` / `DAY03_MOCK_PORT` override).

```bash
node training-lab/day-03/mock-api/server.mjs
curl -s http://127.0.0.1:48139/transactions | jq .
```

Seeded deviation: **TX-FIC-302** (`amountEur` 12500, `seededDeviation: true`).
