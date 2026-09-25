#!/usr/bin/env node
/**
 * Interim AC lint for content/courses/worldline-wave-2/support-2/
 * - every lesson has mode
 * - every lesson ends in a practice slide
 * - every assignment has steps, expected, check, timer, starterPath → existing training-lab folder
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dayDir = path.join(root, "content/courses/worldline-wave-2/support-2");
const trainingLab = path.join(root, "training-lab");

const files = readdirSync(dayDir)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();

if (files.length === 0) {
  console.error("FAIL: no lesson markdown files");
  process.exit(1);
}

let failures = 0;
const report = [];

const fail = (msg) => {
  report.push(msg);
  failures += 1;
};

for (const file of files) {
  const text = readFileSync(path.join(dayDir, file), "utf8");
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    fail(`${file}: missing frontmatter`);
    continue;
  }
  if (!/^mode:\s*(guided|solo|squad)\s*$/m.test(fmMatch[1])) {
    fail(`${file}: missing or invalid mode`);
  }

  const slideStarts = [...text.matchAll(/^## Slide:.*/gm)];
  if (slideStarts.length === 0) {
    fail(`${file}: no slides`);
    continue;
  }
  const lastStart = slideStarts[slideStarts.length - 1].index;
  const lastSlide = text.slice(lastStart);
  if (!/\btype:\s*practice\b/.test(lastSlide)) {
    fail(`${file}: last slide is not type: practice`);
  }

  if (!/\bassignment:\s*\n/.test(lastSlide)) {
    fail(`${file}: practice slide missing assignment block`);
    continue;
  }

  const required = ["steps:", "expected:", "check:", "timer:", "starterPath:"];
  for (const key of required) {
    if (!lastSlide.includes(key)) {
      fail(`${file}: assignment missing ${key}`);
    }
  }

  const starter = lastSlide.match(/starterPath:\s*(\S+)/);
  if (starter) {
    const rel = starter[1].replace(/['"]/g, "");
    const abs = path.join(trainingLab, rel);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) {
      fail(`${file}: starterPath does not exist as folder: ${rel}`);
    } else {
      const jsons = readdirSync(abs).filter((n) => n.endsWith(".json"));
      if (jsons.length === 0) {
        fail(`${file}: starterPath folder has no *.json: ${rel}`);
      }
    }
  }
}

if (failures) {
  console.error(`FAIL (${failures})`);
  for (const line of report) console.error(" -", line);
  process.exit(1);
}
console.log(`PASS: ${files.length} lessons OK under support-2`);
for (const f of files) console.log(" -", f);
