import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const courses = path.join(root, 'apps/web/public/courses');

const required = [
  'SOURCE.md',
  'weather-agent-sdk/LICENSE',
  'weather-agent-sdk/README.md',
  'weather-agent-sdk/index.html',
  'weather-agent-sdk/instructions.md',
  'weather-agent-sdk/styles.css',
  'weather-agent-sdk/main.js',
  'aetherlink-day5-n8n-to-agent/LICENSE',
  'aetherlink-day5-n8n-to-agent/index.html',
  'aetherlink-day5-n8n-to-agent/SOLO.md',
  'aetherlink-day5-n8n-to-agent/docs/fundamentals.md',
  'aetherlink-day5-n8n-to-agent/fixtures/expected-labels.json',
  'aetherlink-day5-n8n-to-agent/fixtures/ticket.json',
  'aetherlink-day5-n8n-to-agent/n8n/support-triage.json',
  'council-agent-sdk/LICENSE',
  'council-agent-sdk/README.md',
  'council-agent-sdk/index.html',
  'council-agent-sdk/instructions.md',
];

test('W4 HTML Solo courses land under apps/web/public/courses (AET-130)', () => {
  for (const rel of required) {
    assert.equal(existsSync(path.join(courses, rel)), true, rel);
  }
  const weatherInstr = readFileSync(path.join(courses, 'weather-agent-sdk/instructions.md'), 'utf8');
  assert.match(weatherInstr, /clothing advice|kledingadvies|jas/i);
  const weatherReadme = readFileSync(path.join(courses, 'weather-agent-sdk/README.md'), 'utf8');
  const weatherHtml = readFileSync(path.join(courses, 'weather-agent-sdk/index.html'), 'utf8');
  assert.match(weatherReadme, /Open Claude Code.*Paste this prompt/is);
  assert.match(weatherReadme, /design input|manual judgment/i);
  assert.match(weatherHtml, /Prompt Claude Code to change one rule/i);
  const councilInstr = readFileSync(path.join(courses, 'council-agent-sdk/instructions.md'), 'utf8');
  assert.match(councilInstr, /Judge rule|rechter/i);
  const councilReadme = readFileSync(path.join(courses, 'council-agent-sdk/README.md'), 'utf8');
  const councilHtml = readFileSync(path.join(courses, 'council-agent-sdk/index.html'), 'utf8');
  assert.match(councilReadme, /Open Claude Code.*Paste this prompt/is);
  assert.match(councilReadme, /strict|mild/i);
  assert.match(councilHtml, /Prompt Claude Code to change the judge rule/i);
  const solo = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/SOLO.md'), 'utf8');
  assert.match(solo, /Step 0/);
  assert.match(solo, /archived optional parity bonus/i);
  assert.match(solo, /not part of the\s+required Workshop 4 lessons/i);
  assert.match(solo, /new customer messages and a transaction workbook/i);
  assert.doesNotMatch(solo, /npm run triage --/);
  assert.match(solo, /AetherLink-bv\/aetherlink-day4-n8n-to-agent/);
  const parityReadme = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/README.md'), 'utf8');
  assert.match(parityReadme, /archived parity reference/i);
  assert.match(parityReadme, /fixtures are separate from Workshop 4's required customer\s+messages/i);
  assert.doesNotMatch(parityReadme, /npm run triage --/);
  const parityHtml = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/index.html'), 'utf8');
  assert.match(parityHtml, /OPTIONAL PARITY BONUS · ARCHIVED/i);
  assert.match(parityHtml, /separate from Workshop 4's support messages/i);
  assert.match(parityHtml, /workshop-4\/BUILD-WITH-CLAUDE\.md/);
  assert.doesNotMatch(parityHtml, /npm run triage --/);
  const fundamentals = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/docs/fundamentals.md'), 'utf8');
  assert.doesNotMatch(fundamentals, /npm run triage --/);
  assert.match(fundamentals, /current Workshop 4 guide/i);
  const retiredLabels = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/fixtures/expected-labels.json'), 'utf8');
  assert.match(retiredLabels, /retired answer labels are not published/i);
  assert.doesNotMatch(retiredLabels, /expected_priority|expected_action/);
});
