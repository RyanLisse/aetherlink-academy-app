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
  const solo = readFileSync(path.join(courses, 'aetherlink-day5-n8n-to-agent/SOLO.md'), 'utf8');
  assert.match(solo, /SOLO 0/);
  assert.match(solo, /Workshop 4/);
});
