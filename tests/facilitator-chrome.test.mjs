import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));

test('F1/F2 teach bar: visible day chip + Dag select + primary Open Classroom', () => {
  assert.match(main, /facilitator-teach/);
  assert.match(main, /fac-day-label/);
  assert.match(main, /classroom\.dayHint/);
  assert.match(main, /control\('day',Number\(/);
  assert.match(main, /className="classroom-open gradient"/);
  assert.match(main, /\{t\('classroom\.open'\)\}/);
  assert.match(css, /facilitator-teach/);
  assert.match(css, /fac-day-label/);
});

test('F4 dials cluster is one session group separate from teach/day', () => {
  assert.match(main, /facilitator-dials/);
  assert.match(main, /fac\.session/);
  assert.match(main, /fac\.startTimer/);
  assert.match(main, /fac\.nextRound/);
  assert.match(main, /fac\.phase/);
  assert.match(main, /fac\.format/);
  // Day select lives in teach row, not dials
  const dialsIdx = main.indexOf('facilitator-dials');
  const dayInDials = main.slice(dialsIdx, dialsIdx + 1200).includes("control('day'");
  assert.equal(dayInDials, false, 'day control must not sit inside dials cluster');
  const teachIdx = main.indexOf('facilitator-teach');
  assert.ok(main.slice(teachIdx, dialsIdx).includes("control('day'"), 'day control belongs in teach bar');
});

test('F5 empty/offline/error surfaces use StatusState + next action', () => {
  assert.match(main, /roster\.emptyHelp/);
  assert.match(main, /roster\.copyCodeShort/);
  assert.match(main, /status\.reload/);
  assert.match(main, /data-testid="intent-document"/);
  assert.match(main, /doc\.emptyTitle/);
  assert.match(main, /StatusState kind="empty" title=\{t\('roster\.empty'\)\}/);
  assert.match(main, /StatusState kind="offline" title=\{t\('status\.offline'\)\}/);
});

test('F3/F7 gates: overlay map + keyboard chrome untouched by teach polish', () => {
  assert.match(main, /classroomEmbedUrl\(room\.day,\s*pinnedDeckIdForRoom\(room\)\)/);
  assert.match(main, /CLASSROOM_SANDBOX/);
  // No LearnHouse / AGPL / Next fork markers in chrome polish
  assert.doesNotMatch(main, /learnhouse/i);
  assert.doesNotMatch(css, /learnhouse/i);
});

test('AET-110 i18n keys present EN+NL', () => {
  for (const key of [
    'fac.teach',
    'fac.session',
    'roster.emptyHelp',
    'roster.copyCodeShort',
    'status.reload',
    'classroom.open',
  ]) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
  assert.match(en['classroom.open'], /Open Classroom/i);
  assert.match(nl['classroom.open'], /Open Classroom/i);
});
