#!/usr/bin/env node
/**
 * CLI: read transactions.csv → emit Risk / Reason / Recommended action per row.
 * Usage: node starter/run.mjs [path/to/transactions.csv]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeTransaction, formatResult } from "./analyze.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.resolve(process.argv[2] || path.join(root, "data/transactions.csv"));
const lines = readFileSync(csvPath, "utf8").trim().split("\n");
const header = lines[0].split(",");
const rows = lines.slice(1).map((line) => {
  const cols = line.split(",");
  const row = {};
  header.forEach((key, i) => {
    row[key] = cols[i];
  });
  return row;
});

const flagged = [];
for (const row of rows) {
  const analysis = analyzeTransaction(row);
  console.log(formatResult(row, analysis));
  if (analysis.risk === "high") flagged.push(row.id);
}
console.error(`# flagged=${flagged.length} ids=${flagged.join(",")}`);
