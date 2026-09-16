# Local n8n review fixture

Learning path (day 3): progressive **0 → 1 → multi** agents on the same chain.
1. Flow without AI agent (deterministic fixture-check).
2. Flow with one bounded AI review step (capture trace).
3. Flow with multiple specialists or parallel agents (document who does what + human gate).
One importable workflow; the three steps are the learning sequence, not three separate JSON files.

Import `n8n-repository-review.json` into an attendee-owned n8n instance. It has
no credentials and no external nodes. Run it with the manual trigger and label
the result `deterministic-run`; it is a shape and boundary exercise, not an AI
model run. A participant may replace the code node with an existing, approved
model adapter, but must record the provider, input, output and trace. Do not
request a new API key for this exercise. `live-model-run-observed` remains
`OPEN` until an actual captured run exists.

Required review output fields are `finding`, `file`, `evidence`, `severity`,
`suggested_next_step`, and `needs_human_decision`. A human must review before
accepting a suggested change. The fictional scenario is `GL-REVIEW-001`; no
GitLab, Jira, Confluence, payment or production write is allowed.
