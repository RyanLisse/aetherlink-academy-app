# Day 3 starter — transaction-alert

Same boundary in three files:

| File | Role |
| --- | --- |
| `transaction-alert.mjs` | Runnable Node reference + `serve` mode |
| `transaction-alert.ts` | Typed twin learners edit |
| `transaction-alert.go` | Go twin (`go run .` / `go run transaction-alert.go`) |

Pipeline: **input → AI stub → business logic → alert draft** (`draft_only`, human gate).

```bash
# with mock on :48139
node transaction-alert.mjs
MOCK_API_URL=http://127.0.0.1:48139 go run transaction-alert.go
```

Deploy: see `DEPLOY.md` + `docker-compose.yml`.
