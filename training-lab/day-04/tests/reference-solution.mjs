/**
 * Facilitator reference solution.
 * Finds every seeded suspicious case and reports false-positive count (ceiling).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { analyzeTransaction } from "../starter/analyze.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadRows(csvPath = path.join(root, "data/transactions.csv")) {
  const lines = readFileSync(csvPath, "utf8").trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    header.forEach((key, i) => {
      row[key] = cols[i];
    });
    return row;
  });
}

/**
 * @param {Array<Record<string, string>>} rows
 * @param {string[]} seededIds from expected.json
 */
export function scoreAgainstSeed(rows, seededIds) {
  const seeded = new Set(seededIds);
  const flagged = [];
  const missed = [];
  const falsePositives = [];

  for (const row of rows) {
    const { risk } = analyzeTransaction(row);
    const isSeeded = seeded.has(row.id);
    if (risk === "high") {
      flagged.push(row.id);
      if (!isSeeded) falsePositives.push(row.id);
    } else if (isSeeded) {
      missed.push(row.id);
    }
  }

  return {
    flagged,
    missed,
    falsePositives,
    falsePositiveCount: falsePositives.length,
    foundAllSeeded: missed.length === 0,
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const expected = JSON.parse(readFileSync(path.join(root, "tests/expected.json"), "utf8"));
  const result = scoreAgainstSeed(loadRows(), expected.suspiciousIds);
  console.log(JSON.stringify(result, null, 2));
}
