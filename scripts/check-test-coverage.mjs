#!/usr/bin/env node
// Fails when a tests/*.test.{mjs,ts} file is neither referenced by a GitHub
// workflow nor listed in EXCLUDED with a reason.
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// file (relative to tests/) -> one-line reason it is not run in CI.
// Prefix `broken:` when the test fails because of a real product bug.
export const EXCLUDED = {
  'authoring-chrome.test.mjs': 'broken: F1 trail test expects decks.youAreHere in src/slides.jsx, removed by the slides UI simplification (#156)',
  'distributed-browser.test.mjs': "broken: joins via getByLabel('Je naam') but the UI now defaults to EN ('Your name', AET-122 #175), so the join times out",
};

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findUncovered({testFiles, workflowText, excluded = EXCLUDED}) {
  const referenced = (file) => new RegExp(`(^|[^\\w./-])tests/${escape(file)}(?![\\w.-])`, 'm').test(workflowText);
  const problems = [];
  for (const file of testFiles) {
    const isReferenced = referenced(file);
    const reason = excluded[file];
    if (!isReferenced && !reason?.trim()) problems.push(`tests/${file} is not run by any workflow in .github/workflows and has no exclusion reason`);
    if (isReferenced && reason !== undefined) problems.push(`tests/${file} is run by a workflow; remove its stale exclusion`);
  }
  for (const file of Object.keys(excluded)) {
    if (!testFiles.includes(file)) problems.push(`exclusion for tests/${file} points at a file that does not exist`);
  }
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const testFiles = readdirSync(path.join(root, 'tests')).filter((name) => /\.test\.(mjs|ts)$/.test(name)).sort();
  const workflowDir = path.join(root, '.github/workflows');
  const workflowText = readdirSync(workflowDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => readFileSync(path.join(workflowDir, name), 'utf8'))
    .join('\n');
  const problems = findUncovered({testFiles, workflowText});
  if (problems.length) {
    console.error(problems.map((problem) => `- ${problem}`).join('\n'));
    console.error(`\nAdd the file to a step in .github/workflows/ci.yml, or to EXCLUDED in scripts/check-test-coverage.mjs with a reason.`);
    process.exit(1);
  }
  console.log(`${testFiles.length} test files: ${testFiles.length - Object.keys(EXCLUDED).length} run in CI, ${Object.keys(EXCLUDED).length} excluded with a reason.`);
}
