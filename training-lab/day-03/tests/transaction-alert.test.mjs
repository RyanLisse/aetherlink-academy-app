import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createMockApi } from "../mock-api/server.mjs";
import {
  alertForTransaction,
  runAgainstMock,
} from "../starter/transaction-alert.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const starterDir = path.join(root, "../starter");
const fixture = JSON.parse(readFileSync(path.join(root, "../data/transactions.json"), "utf8"));
const seeded = fixture.find((row) => row.id === "TX-FIC-302");

const expectedDraftShape = {
  transactionId: "TX-FIC-302",
  alert: true,
  severity: "high",
  reason: "amount exceeds the fictional review threshold",
  draft_only: true,
  human_approval_required: true,
};

test("fixture seeds TX-FIC-302 as the high deviation", () => {
  assert.equal(seeded.amountEur, 12500);
  assert.equal(seeded.seededDeviation, true);
  const draft = alertForTransaction(seeded);
  assert.equal(draft.alert, true);
  assert.equal(draft.severity, "high");
  assert.equal(draft.reason, expectedDraftShape.reason);
  assert.equal(draft.draft_only, true);
  assert.equal(draft.human_approval_required, true);
  assert.ok(draft.ai.score >= 0.7);
});

test("TypeScript twin source exports the same pipeline symbols", () => {
  const ts = readFileSync(path.join(starterDir, "transaction-alert.ts"), "utf8");
  assert.match(ts, /export const alertForTransaction/);
  assert.match(ts, /export const runAgainstMock/);
  assert.match(ts, /input → AI → business logic → alert draft/);
  assert.match(ts, /amount exceeds the fictional review threshold/);
  assert.match(ts, /draft_only: true/);
});

test("TypeScript starter hits mock API via tsx and returns expected alert draft", async () => {
  const { server, baseUrl } = await createMockApi({ port: 0 });
  try {
    const draft = await new Promise((resolve, reject) => {
      const child = spawn("npx", ["--yes", "tsx@4.19.3", "transaction-alert.ts"], {
        cwd: starterDir,
        env: { ...process.env, MOCK_API_URL: baseUrl, npm_config_fund: "false", npm_config_audit: "false" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`tsx exited ${code}: ${stderr || stdout}`));
          return;
        }
        try {
          // tsx may print warnings on stderr; JSON is on stdout
          const jsonStart = stdout.indexOf("{");
          resolve(JSON.parse(stdout.slice(jsonStart)));
        } catch (error) {
          reject(new Error(`invalid JSON from ts starter: ${stdout}\n${stderr}\n${error}`));
        }
      });
    });
    assert.equal(draft.transactionId, "TX-FIC-302");
    assert.equal(draft.alert, true);
    assert.equal(draft.severity, "high");
    assert.equal(draft.reason, expectedDraftShape.reason);
    assert.equal(draft.draft_only, true);
    assert.equal(draft.human_approval_required, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Node starter hits mock API and returns expected alert draft", async () => {
  const { server, baseUrl } = await createMockApi({ port: 0 });
  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    const draft = await runAgainstMock(baseUrl, "TX-FIC-302");
    assert.equal(draft.transactionId, "TX-FIC-302");
    assert.equal(draft.alert, true);
    assert.equal(draft.severity, "high");
    assert.equal(draft.reason, expectedDraftShape.reason);
    assert.equal(draft.draft_only, true);
    assert.equal(draft.human_approval_required, true);
    assert.equal(draft.framing, "Fictional Reconciliation");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Go starter hits mock API and returns expected alert draft", async () => {
  const { server, baseUrl } = await createMockApi({ port: 0 });
  try {
    const draft = await new Promise((resolve, reject) => {
      const child = spawn("go", ["run", "transaction-alert.go"], {
        cwd: starterDir,
        env: { ...process.env, MOCK_API_URL: baseUrl },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`go run exited ${code}: ${stderr || stdout}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(new Error(`invalid JSON from go starter: ${stdout}\n${stderr}\n${error}`));
        }
      });
    });
    assert.equal(draft.transactionId, "TX-FIC-302");
    assert.equal(draft.alert, true);
    assert.equal(draft.severity, "high");
    assert.equal(draft.reason, expectedDraftShape.reason);
    assert.equal(draft.draft_only, true);
    assert.equal(draft.human_approval_required, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Node serve mode exposes /alert evidence URL", async () => {
  const mock = await createMockApi({ port: 0 });
  const port = 18090 + Math.floor(Math.random() * 200);
  const svc = spawn(process.execPath, ["transaction-alert.mjs", "serve"], {
    cwd: starterDir,
    env: { ...process.env, MOCK_API_URL: mock.baseUrl, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("serve startup timeout")), 4000);
      const onData = (chunk) => {
        if (chunk.toString().includes("transaction-alert")) {
          clearTimeout(timer);
          resolve();
        }
      };
      svc.stdout.on("data", onData);
      svc.stderr.on("data", onData);
      svc.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`serve exited early ${code}`));
      });
    });
    const response = await fetch(`http://127.0.0.1:${port}/alert?id=TX-FIC-302`);
    assert.equal(response.status, 200);
    const draft = await response.json();
    assert.equal(draft.alert, true);
    assert.equal(draft.transactionId, "TX-FIC-302");
  } finally {
    svc.kill("SIGTERM");
    await new Promise((resolve) => mock.server.close(resolve));
  }
});
