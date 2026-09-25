# Deploy recipe — day-03 transaction-alert

## Laptop / single participant

```bash
# terminal A — mock
node training-lab/day-03/mock-api/server.mjs

# terminal B — service (Node reference)
MOCK_API_URL=http://127.0.0.1:48139 PORT=8080 \
  node training-lab/day-03/starter/transaction-alert.mjs serve

# evidence
curl -s http://127.0.0.1:8080/alert?id=TX-FIC-302
```

Go twin:

```bash
MOCK_API_URL=http://127.0.0.1:48139 PORT=8081 \
  go run training-lab/day-03/starter/transaction-alert.go serve
```

## Docker Compose (one container / participant)

From `training-lab/day-03/starter/`:

```bash
PARTICIPANT_PORT=18081 SLUG=ari docker compose -p trainee-ari up -d --build
curl -s http://127.0.0.1:18081/alert?id=TX-FIC-302
```

Published URL pattern on the training host:

`http://<training-host>:<PARTICIPANT_PORT>/alert?id=TX-FIC-302`

## Teardown (infra note — comment only)

Participant containers need a **namespace** (compose project `trainee-${SLUG}`) and a **teardown script** owned by the training-host / domain infra ticket — **not implemented in this content PR**.

```bash
# operator sketch (do not treat as production infra)
docker compose -p trainee-${SLUG} down -v
```
