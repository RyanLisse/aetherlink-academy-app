#!/usr/bin/env node
/**
 * Interim AC lint for content/courses/worldline-wave-2/support-5/
 * - every lesson has mode (guided|solo|squad)
 * - at least one lesson uses mode: squad
 * - every lesson ends in a practice slide
 * - every assignment has steps, expected, check, timer, starterPath → day-05/starter
 * - starter must contain challenge.mjs + handoff-template.md
 * - optional-day / preserves access language appears in the pack
 * - agent-native chat template link appears in the pack
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dayDir = path.join(root, "content/courses/worldline-wave-2/support-5");
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
let sawSquad = false;
let packText = "";

const fail = (msg) => {
  report.push(msg);
  failures += 1;
};

for (const file of files) {
  const text = readFileSync(path.join(dayDir, file), "utf8");
  packText += text;
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    fail(`${file}: missing frontmatter`);
    continue;
  }
  if (!/^mode:\s*(guided|solo|squad)\s*$/m.test(fmMatch[1])) {
    fail(`${file}: missing or invalid mode`);
  }
  if (!/^day:\s*support-5\s*$/m.test(fmMatch[1])) {
    fail(`${file}: day must be support-5`);
  }
  if (/^mode:\s*squad\s*$/m.test(fmMatch[1])) {
    sawSquad = true;
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
      const names = readdirSync(abs);
      if (!names.includes("challenge.mjs")) {
        fail(`${file}: starterPath folder missing challenge.mjs: ${rel}`);
      }
      if (!names.includes("handoff-template.md")) {
        fail(`${file}: starterPath folder missing handoff-template.md: ${rel}`);
      }
    }
  }
}

if (!sawSquad) {
  fail("pack missing mode: squad lesson (final review room required)");
}

if (!/preserves access and progress/i.test(packText)) {
  fail("pack missing optional-day copy: preserves access and progress");
}

if (!/github\.com\/BuilderIO\/agent-native\/tree\/main\/templates\/chat/.test(packText)) {
  fail("pack missing agent-native templates/chat architecture link");
}

const casesPath = path.join(trainingLab, "day-05/data/cases.json");
if (!existsSync(casesPath)) {
  fail("training-lab/day-05/data/cases.json missing");
} else {
  const cases = JSON.parse(readFileSync(casesPath, "utf8"));
  for (const entry of cases) {
    if (!entry.brief || entry.brief.length < 40) {
      fail(`case ${entry.id}: brief too short`);
    }
    const ds = path.join(trainingLab, "day-05/data", entry.dataset);
    if (!existsSync(ds)) {
      fail(`case ${entry.id}: missing dataset ${entry.dataset}`);
    }
    if (entry.mockEndpoint) {
      const mock = path.join(trainingLab, "day-05", entry.mockEndpoint, "server.mjs");
      if (!existsSync(mock)) {
        fail(`case ${entry.id}: missing mock ${entry.mockEndpoint}`);
      }
    }
  }
}

if (failures) {
  console.error(`FAIL (${failures})`);
  for (const line of report) console.error(" -", line);
  process.exit(1);
}
console.log(`PASS: ${files.length} lessons OK under support-5 (squad present)`);
for (const f of files) console.log(" -", f);
