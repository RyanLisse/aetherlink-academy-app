# Day 1 starter

Assignment cards use `assignment.starterPath: day-01/starter` (relative to
`training-lab/`).

## Import into n8n

1. Start the training-lab mocks (`pnpm --filter training-lab start:mocks`).
2. In n8n (Cloud trial or local): **Import from File**.
3. Import one JSON at a time:
   - `weather-agent.json` — primary AC path
   - `rising-steps.json` — Set / Code / Switch drafts
   - `support-triage.json` — end challenge (adapted upstream)
4. Select chat-model credentials in the UI only. Never export credentials back
   into this repository.
5. For `weather-agent.json`, ensure `weatherBaseUrl` reaches the mock
   (`http://127.0.0.1:48135` locally, or a tunnel from n8n Cloud).
6. Execute once. Evidence = execution log / screenshot. Outputs stay
   `draft_only`.

## Deterministic helper (no n8n)

```sh
node --test training-lab/day-01/tests/weather-agent.test.mjs
```

Amsterdam · 2026-09-21 → `bring umbrella`.
