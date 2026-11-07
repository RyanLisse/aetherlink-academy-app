import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const courses = path.join(root, 'apps/web/public/courses');
const course = path.join(courses, 'aetherlink-daily-brief-lab-s1');

const required = [
  'aetherlink-daily-brief-lab-s1/LICENSE',
  'aetherlink-daily-brief-lab-s1/README.md',
  'aetherlink-daily-brief-lab-s1/index.html',
  'aetherlink-daily-brief-lab-s1/main.js',
  'aetherlink-daily-brief-lab-s1/styles.css',
  'aetherlink-daily-brief-lab-s1/intent.md',
  'aetherlink-daily-brief-lab-s1/SOLO.md',
  'aetherlink-daily-brief-lab-s1/CLAUDE.md',
  'aetherlink-daily-brief-lab-s1/AGENTS.md',
  'aetherlink-daily-brief-lab-s1/progress.md',
  'aetherlink-daily-brief-lab-s1/docs/spec.md',
  'aetherlink-daily-brief-lab-s1/docs/gate.md',
  'aetherlink-daily-brief-lab-s1/docs/evidence.md',
  'aetherlink-daily-brief-lab-s1/docs/plan.md',
  'aetherlink-daily-brief-lab-s1/docs/design.md',
  'aetherlink-daily-brief-lab-s1/docs/prompts.md',
];

test('W5 daily-brief HTML course + Assignments + SOLO land under /courses (AET-131)', () => {
  for (const rel of required) {
    assert.equal(existsSync(path.join(courses, rel)), true, rel);
  }
  const html = readFileSync(path.join(course, 'index.html'), 'utf8');
  for (const id of ['module-1', 'module-2', 'module-3', 'module-4', 'module-5', 'module-6']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /empty on purpose/i);
  const intent = readFileSync(path.join(course, 'intent.md'), 'utf8');
  assert.match(intent, /Outcome/);
  assert.match(intent, /Success checks|Boundary/i);
  const spec = readFileSync(path.join(course, 'docs/spec.md'), 'utf8');
  assert.match(spec, /Spec|contract|EXAMPLE|TEMPLATE/i);
  const gate = readFileSync(path.join(course, 'docs/gate.md'), 'utf8');
  assert.match(gate, /PASS|FAIL|OPEN/);
  const solo = readFileSync(path.join(course, 'SOLO.md'), 'utf8');
  assert.match(solo, /seven steps|### 1 ·|### 7 ·/i);
  assert.match(solo, /main.*empty|empty on purpose|step 0/i);
  assert.match(solo, /Claude Code/i);
  assert.doesNotMatch(solo, /git checkout\s+\S+\s+--/i);
  const prompts = readFileSync(path.join(course, 'docs/prompts.md'), 'utf8');
  assert.equal((prompts.match(/Build prompt:/g) ?? []).length, 7);
  assert.equal((prompts.match(/Improvement prompt:/g) ?? []).length, 7);
  const readme = readFileSync(path.join(course, 'README.md'), 'utf8');
  assert.match(readme, /Do not copy solved files/i);
  assert.doesNotMatch(`${readme}\n${html}`, /git checkout\s+\S+\s+--/i);
  assert.match(html, /src\/main\.ts/);
  assert.match(html, /inactive schedule/i);
  assert.doesNotMatch(html, /gitlab-ci/i);
});
