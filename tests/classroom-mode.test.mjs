import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSROOM_SANDBOX, classroomEmbedUrl, classroomPathForDay} from '../src/classroom.js';

const DAY_PATHS = [
  [1, '/classroom/1'],
  [2, '/classroom/2'],
  [3, '/workshop/3'],
  [4, '/workshop/4'],
  [5, '/workshop/5'],
  [6, '/workshop/6'],
  [7, '/workshop/7'],
];

test('classroomPathForDay maps room.day to Academy classroom/workshop routes', () => {
  for (const [day, path] of DAY_PATHS) {
    assert.equal(classroomPathForDay(day), path, `day ${day}`);
    assert.equal(classroomEmbedUrl(day), path, `embed day ${day}`);
  }
});

test('classroomPathForDay falls back to Classroom 1 for unknown days', () => {
  for (const day of [0, 8, 99, null, undefined, 'nope', NaN]) {
    assert.equal(classroomPathForDay(day), '/classroom/1', String(day));
  }
});

test('Google Classroom deck id and docs.google embed are gone', async () => {
  const {readFileSync} = await import('node:fs');
  const classroom = readFileSync(new URL('../src/classroom.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(classroom, /CLASSROOM_DECK_ID/);
  assert.doesNotMatch(classroom, /1DZ9-9Xynh/);
  assert.doesNotMatch(classroom, /docs\.google\.com/);
  assert.doesNotMatch(main, /docs\.google\.com/);
  assert.doesNotMatch(main, /1DZ9-9Xynh/);
  assert.match(classroomEmbedUrl(1), /^\/classroom\/1$/);
  assert.doesNotMatch(classroomEmbedUrl(1), /^https:\/\//);
});

test('facilitator classroom UI hooks exist in main.jsx', async () => {
  const {readFileSync} = await import('node:fs');
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /ClassroomOverlay/);
  assert.match(main, /onOpenClassroom/);
  assert.match(main, /classroomOpen/);
  assert.match(main, /classroom\.title/);
  assert.match(main, /classroom\.exit/);
  assert.match(main, /keydown/);
  assert.match(main, /Escape/);
  assert.doesNotMatch(main, /vendor\/proof-sdk/);
});

test('classroom chrome is translated in both catalogs', async () => {
  const {readFileSync} = await import('node:fs');
  const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
  const nl = JSON.parse(readFileSync(new URL('../src/i18n/nl.json', import.meta.url), 'utf8'));
  for (const key of ['classroom.title', 'classroom.open', 'classroom.exit', 'classroom.exitShort', 'classroom.dayHint', 'classroom.frameTitle']) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
  assert.match(en['classroom.dayHint'], /\{day\}/);
  assert.match(nl['classroom.dayHint'], /\{day\}/);
});

test('classroom iframe is sandboxed and cannot navigate the facilitator away', async () => {
  const {readFileSync} = await import('node:fs');
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /className="classroom-frame"[^>]*sandbox=\{CLASSROOM_SANDBOX\}/);
  assert.match(main, /classroomEmbedUrl\(room\.day\)/);

  const tokens = CLASSROOM_SANDBOX.split(' ');
  for (const needed of ['allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-presentation']) {
    assert.ok(tokens.includes(needed), `missing ${needed}`);
  }
  for (const withheld of ['allow-top-navigation', 'allow-top-navigation-by-user-activation', 'allow-forms', 'allow-downloads', 'allow-modals', 'allow-pointer-lock']) {
    assert.ok(!tokens.includes(withheld), `unexpectedly granted ${withheld}`);
  }
});
