import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEED } from "../data/generate.mjs";
import { loadRows, scoreAgainstSeed } from "./reference-solution.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(root, "data/transactions.csv");
const hash = () => createHash("sha256").update(readFileSync(csvPath)).digest("hex");
const expected = JSON.parse(readFileSync(path.join(root, "tests/expected.json"), "utf8"));

test("fixed seed is pinned", () => {
  assert.equal(SEED, expected.seed);
  assert.equal(SEED, 20260921);
});

test("regenerating with the same seed yields an identical file hash", () => {
  execFileSync(process.execPath, [path.join(root, "data/generate.mjs")]);
  const firstHash = hash();
  assert.equal(firstHash, expected.csvSha256);
  execFileSync(process.execPath, [path.join(root, "data/generate.mjs")]);
  assert.equal(hash(), firstHash);
});

test("reference solution finds every seeded case and reports FP count", () => {
  const rows = loadRows(csvPath);
  const score = scoreAgainstSeed(rows, expected.suspiciousIds);
  assert.equal(score.foundAllSeeded, true, `missed: ${score.missed.join(",")}`);
  assert.deepEqual(
    score.flagged.filter((id) => expected.suspiciousIds.includes(id)).sort(),
    [...expected.suspiciousIds].sort(),
  );
  assert.equal(score.falsePositiveCount, 0, `FPs: ${score.falsePositives.join(",")}`);
  assert.ok(!score.flagged.includes("TX-FIC-421"));
  console.log(
    JSON.stringify({
      seededFound: expected.suspiciousIds.length,
      falsePositiveCount: score.falsePositiveCount,
      flagged: score.flagged,
    }),
  );
});

test("CSV uses clearly fictional names and IDs", () => {
  const csv = readFileSync(csvPath, "utf8");
  assert.match(csv, /TX-FIC-/);
  assert.match(csv, /Example/);
  assert.match(csv, /NL-TRAIN|BE-TRAIN/);
  assert.doesNotMatch(csv, /worldline\.com|@customer|iban/i);
});

test("CLI emits Risk / Reason / Recommended action", () => {
  const out = execFileSync(process.execPath, [path.join(root, "starter/run.mjs"), csvPath], {
    encoding: "utf8",
  });
  assert.match(out, /TX-FIC-430: high \/ .+ \/ human review/);
  assert.match(out, /TX-FIC-421: low \/ .+ \/ allow/);
});
