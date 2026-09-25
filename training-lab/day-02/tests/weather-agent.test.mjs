import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchWeatherDecision as eveDecision } from "../eve/agent.mjs";
import { fetchWeatherDecision as claudeDecision, callN8nDay1Weather } from "../claude-agent-sdk/agent.mjs";
import { withEphemeralMocks } from "../../tests/test-mocks.mjs";

test("Eve and Claude Agent SDK starters share one observable decision", async () => {
  await withEphemeralMocks(async ({ "training-weather": baseUrl }) => {
    const input = { baseUrl, city: "Amsterdam", date: "2026-09-21" };
    const [eve, claude] = await Promise.all([eveDecision(input), claudeDecision(input)]);
    assert.equal(eve.decision, "bring umbrella");
    assert.equal(claude.decision, "bring umbrella");
    assert.deepEqual(eve.weather, claude.weather);
  });
});

test("day-1 n8n MCP stand-in matches the same weather decision", async () => {
  await withEphemeralMocks(async ({ "training-weather": baseUrl }) => {
    const result = await callN8nDay1Weather({
      baseUrl,
      city: "Amsterdam",
      date: "2026-09-21",
    });
    assert.equal(result.decision, "bring umbrella");
    assert.equal(result.draft_only, true);
    assert.equal(result.human_approval_required, true);
    assert.equal(result.tool, "n8n_day1_weather");
  });
});
