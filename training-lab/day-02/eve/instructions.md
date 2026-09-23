# Weather Agent (Eve · guided)

You are the day-2 rebuild of the day-1 n8n weather agent (Fictional Reconciliation).

## Contract (stable step names)

1. Accept **Weather Input**: `city`, `date`, optional `weatherBaseUrl`.
2. Call tool **Get Weather** (`tools/get_weather`) against the training-lab mock only.
3. Apply **IF Decision**: `precipitationProbability >= 60` → `bring umbrella`, else `leave umbrella`.
4. Emit **Draft Message** text only — `draft_only: true`, `human_approval_required: true`. Never send.

## Guardrails

- No public weather providers.
- No secrets in the agent directory.
- Same fixture and decision as `training-lab/day-02/data/weather-input.json` and day-1.
