import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMockApi } from "../mock-api/server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every day-5 case has a one-paragraph brief and dataset or mock", () => {
  const cases = JSON.parse(readFileSync(path.join(root, "data/cases.json"), "utf8"));
  assert.ok(cases.length >= 3);
  for (const entry of cases) {
    assert.equal(entry.fictional, true);
    assert.ok(typeof entry.brief === "string" && entry.brief.length > 40, entry.id);
    assert.ok(!/\n/.test(entry.brief.trim()), `${entry.id} brief must be one paragraph`);
    const datasetPath = path.join(root, "data", entry.dataset);
    assert.ok(existsSync(datasetPath), `${entry.id} missing dataset ${entry.dataset}`);
    assert.ok(readFileSync(datasetPath, "utf8").trim().length > 0, entry.id);
    if (entry.mockEndpoint) {
      assert.ok(
        existsSync(path.join(root, entry.mockEndpoint, "server.mjs")),
        `${entry.id} missing mock ${entry.mockEndpoint}`,
      );
    }
  }
});

test("handoff template and challenge starter exist", () => {
  assert.ok(existsSync(path.join(root, "starter/handoff-template.md")));
  assert.ok(existsSync(path.join(root, "starter/challenge.mjs")));
  const handoff = readFileSync(path.join(root, "starter/handoff-template.md"), "utf8");
  assert.match(handoff, /PASS \/ REVISE \/ OPEN/);
  assert.match(handoff, /preserves access and progress/i);
});

test("mock-api serves fictional high-risk rows", async () => {
  const started = await createMockApi({ port: 0 });
  try {
    const health = await fetch(`${started.baseUrl}/health`).then((r) => r.json());
    assert.equal(health.ok, true);
    assert.equal(health.fictional, true);
    const body = await fetch(`${started.baseUrl}/transactions?highRisk=true`).then((r) =>
      r.json(),
    );
    assert.ok(body.count >= 2);
    for (const row of body.transactions) {
      assert.equal(row.seededHighRisk, true);
      assert.match(row.id, /^TX-FIC-/);
    }
  } finally {
    await new Promise((resolve) => started.server.close(resolve));
  }
});
