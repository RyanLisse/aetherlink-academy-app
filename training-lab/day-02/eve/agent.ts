/**
 * Pedagogical Eve root config (filesystem agent).
 * Runtime import of `eve` happens only when a learner installs the pin in
 * package.json (0.64.1). The shared acceptance test uses agent.mjs instead —
 * it does not claim a model-backed Eve run.
 *
 * Canonical step names: see training-lab/day-01/STEP-NAMES.md
 *   Weather Input → Get Weather → Weather Agent → IF Decision → Draft Message
 */
export const evePin = "0.64.1" as const;

export const agentMeta = {
  name: "weather-agent",
  model: "anthropic/claude-sonnet-4",
  fictional: true,
  draftOnly: true,
  humanApprovalRequired: true,
} as const;

/** Placeholder matching Eve `defineAgent({ model })` shape for classroom copy. */
export default {
  model: agentMeta.model,
  name: agentMeta.name,
};
