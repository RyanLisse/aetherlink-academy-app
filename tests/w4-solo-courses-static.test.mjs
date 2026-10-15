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
  'weather-agent-sdk/index.html',
  'weather-agent-sdk/instructions.md',
  'weather-agent-sdk/styles.css',
  'weather-agent-sdk/main.js',
  'aetherlink-day5-n8n-to-agent/LICENSE',
  'aetherlink-day5-n8n-to-agent/README.md',
  'aetherlink-day5-n8n-to-agent/index.html',
  'aetherlink-day5-n8n-to-agent/SOLO.md',
  'aetherlink-day5-n8n-to-agent/fixtures/expected-labels.json',
  'aetherlink-day5-n8n-to-agent/fixtures/ticket.json',
  'aetherlink-day5-n8n-to-agent/n8n/support-triage.json',
  'council-agent-sdk/LICENSE',
  'council-agent-sdk/index.html',
  'council-agent-sdk/instructions.md',
];

test('W4 HTML Solo courses land under apps/web/public/courses (AET-130)', () => {
  for (const rel of required) {
    assert.equal(existsSync(path.join(courses, rel)), true, rel);
  }
  const weatherInstr = readFileSync(path.join(courses, 'weather-agent-sdk/instructions.md'), 'utf8');
  assert.match(weatherInstr, /clothing advice|kledingadvies|jas/i);
  const councilInstr = readFileSync(path.join(courses, 'council-agent-sdk/instructions.md'), 'utf8');
  assert.match(councilInstr, /Judge rule|rechter/i);
  const source = readFileSync(path.join(courses, 'SOURCE.md'), 'utf8');
  assert.match(source, /aetherlink-day5-n8n-to-agent@5df4d07b6e958394e12bc61c500092cf88d85b5f/);
  assert.match(source, /keeps its existing HTML shell, engine, and fundamentals page/);
  const readme = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/README.md'), 'utf8');
  assert.match(readme, /^# Workshop 4 · From n8n to Claude Agents SDK/m);
  assert.match(readme, /This repo is the whole workshop/);
  const solo = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/SOLO.md'), 'utf8');
  assert.match(solo, /Step 0/);
  assert.match(solo, /^# Workshop 4 · Step by step/m);
  assert.match(solo, /\| 4 \| Acceptance table and `npm run check` \| `step-4` \|/);
  assert.match(solo, /^## Stretch · Assignment: chat in, chat out$/m);
  const parityHtml = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/index.html'), 'utf8');
  assert.match(parityHtml, /optional parity bonus/i);
  assert.match(parityHtml, /separate from Workshop 4's support messages/i);
});
