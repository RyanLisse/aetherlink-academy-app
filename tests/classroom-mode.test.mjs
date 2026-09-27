import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASSROOM_SANDBOX,
  classroomEmbedUrl,
  classroomPathForDay,
  effectDeckPresentPath,
  pinnedDeckIdForRoom,
} from '../src/classroom.js';

const DAY_PATHS = [
  [1, '/classroom/1'],
  [2, '/classroom/2'],
  [3, '/workshop/3'],
  [4, '/workshop/4'],
  [5, '/workshop/5'],
  [6, '/workshop/6'],
  [7, '/workshop/7'],
];

const PINNED = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

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

test('pinned Effect deck overrides day map with /game/decks/:id/present', () => {
  assert.equal(effectDeckPresentPath(PINNED), `/game/decks/${PINNED}/present`);
  assert.equal(classroomEmbedUrl(1, PINNED), `/game/decks/${PINNED}/present`);
  assert.equal(classroomEmbedUrl(3, PINNED), `/game/decks/${PINNED}/present`);
  // unpin / invalid → Slice A fallback
  assert.equal(classroomEmbedUrl(1, null), '/classroom/1');
  assert.equal(classroomEmbedUrl(3, undefined), '/workshop/3');
  assert.equal(classroomEmbedUrl(2, 'not-a-uuid'), '/classroom/2');
  assert.equal(classroomEmbedUrl(5, ''), '/workshop/5');
});

test('pinnedDeckIdForRoom reads current-day pin from room view', () => {
  assert.equal(pinnedDeckIdForRoom({day: 2, classroomOverlayDeckId: PINNED}), PINNED);
  assert.equal(
    pinnedDeckIdForRoom({day: 2, classroomOverlayByDay: {2: PINNED, 1: '11111111-1111-1111-1111-111111111111'}}),
    PINNED,
  );
  assert.equal(pinnedDeckIdForRoom({day: 3, classroomOverlayByDay: {2: PINNED}}), null);
  assert.equal(pinnedDeckIdForRoom({day: 1, classroomOverlayByDay: {}}), null);
  assert.equal(pinnedDeckIdForRoom(null), null);
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
  assert.match(main, /pinnedDeckIdForRoom/);
  assert.doesNotMatch(main, /vendor\/proof-sdk/);
});

test('classroom chrome is translated in both catalogs', async () => {
  const {readFileSync} = await import('node:fs');
  const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
  const nl = JSON.parse(readFileSync(new URL('../src/i18n/nl.json', import.meta.url), 'utf8'));
  for (const key of [
    'classroom.title',
    'classroom.open',
    'classroom.exit',
    'classroom.exitShort',
    'classroom.dayHint',
    'classroom.frameTitle',
    'classroom.pinnedHint',
    'decks.pinOverlay',
    'decks.unpinOverlay',
    'decks.pinOverlayShort',
    'decks.unpinOverlayShort',
    'decks.pinnedNotice',
  ]) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
  assert.match(en['classroom.dayHint'], /\{day\}/);
  assert.match(nl['classroom.dayHint'], /\{day\}/);
  assert.match(en['decks.pinOverlay'], /\{day\}/);
});

test('classroom iframe is sandboxed and prefers pinned Effect present URL', async () => {
  const {readFileSync} = await import('node:fs');
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /className="classroom-frame"[^>]*sandbox=\{CLASSROOM_SANDBOX\}/);
  assert.match(main, /classroomEmbedUrl\(room\.day,\s*pinnedDeckIdForRoom\(room\)\)/);

  const tokens = CLASSROOM_SANDBOX.split(' ');
  for (const needed of ['allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-presentation']) {
    assert.ok(tokens.includes(needed), `missing ${needed}`);
  }
  for (const withheld of [
    'allow-top-navigation',
    'allow-top-navigation-by-user-activation',
    'allow-forms',
    'allow-downloads',
    'allow-modals',
    'allow-pointer-lock',
  ]) {
    assert.ok(!tokens.includes(withheld), `unexpectedly granted ${withheld}`);
  }
});

test('Slide decks UI exposes facilitator pin action', async () => {
  const {readFileSync} = await import('node:fs');
  const slides = readFileSync(new URL('../src/slides.jsx', import.meta.url), 'utf8');
  assert.match(slides, /classroom-overlay/);
  assert.match(slides, /decks\.pinOverlay/);
  assert.match(slides, /PinOff|Pin/);
  assert.match(slides, /togglePin/);
});
