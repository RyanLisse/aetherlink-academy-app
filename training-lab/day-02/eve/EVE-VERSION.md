# Eve version pin (AET-37)

| Field | Value |
| --- | --- |
| Package | `eve` (npm) |
| Pinned version | **0.64.1** |
| Source of truth | `training-lab/day-02/eve/package.json` → `dependencies.eve` |
| Checked | 2026-09-23 (registry.npmjs.org/eve/latest was 0.64.1) |

## Facilitator preflight (before every training)

1. Confirm pin: `node -e "console.log(require('./package.json').dependencies.eve)"` from this folder → `0.64.1`.
2. On a throwaway machine / VM: `npm install eve@0.64.1` (learner-owned credential; never commit `.env`).
3. Retest CLI: `npx eve@0.64.1 --help` (or `eve info` inside a scaffold) and the deterministic acceptance test below.
4. From repo root: `pnpm --filter training-lab test` (day-02 weather test must pass).

If Eve beta breaks the starter, use the **plan-B** slide (`demo-fallback`) — do not invent a live fix mid-session without evidence.
