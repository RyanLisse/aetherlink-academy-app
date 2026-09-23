#!/usr/bin/env node
/**
 * Day-05 starter helper — list cases and validate a chosen case id.
 * Does not call live services.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(readFileSync(path.join(root, "data/cases.json"), "utf8"));

const [, , cmd, caseId] = process.argv;

const printCases = () => {
  for (const entry of cases) {
    const mock = entry.mockEndpoint ? ` mock=${entry.mockEndpoint}` : "";
    console.log(`${entry.id}\t${entry.title}\tdata=${entry.dataset}${mock}`);
  }
};

const validate = (id) => {
  const entry = cases.find((row) => row.id === id);
  if (!entry) {
    console.error(`Unknown case: ${id}`);
    process.exit(1);
  }
  const datasetPath = path.join(root, "data", entry.dataset);
  if (!existsSync(datasetPath)) {
    console.error(`Missing dataset: ${entry.dataset}`);
    process.exit(1);
  }
  if (entry.mockEndpoint) {
    const mockPath = path.join(root, entry.mockEndpoint, "server.mjs");
    if (!existsSync(mockPath)) {
      console.error(`Missing mock endpoint: ${entry.mockEndpoint}`);
      process.exit(1);
    }
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        id: entry.id,
        title: entry.title,
        brief: entry.brief,
        dataset: entry.dataset,
        mockEndpoint: entry.mockEndpoint,
        fictional: entry.fictional,
        shapes: entry.shape,
      },
      null,
      2,
    ),
  );
};

if (cmd === "list" || !cmd) {
  printCases();
} else if (cmd === "validate" && caseId) {
  validate(caseId);
} else {
  console.error("Usage: node challenge.mjs [list|validate CASE-FIC-5xx]");
  process.exit(1);
}
