import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSROOM_DECK_ID, SLIDES_EMBED_URL, classroomEmbedUrl} from '../src/classroom.js';

test('classroom embed targets Wave daily deck and /embed', () => {
  assert.equal(CLASSROOM_DECK_ID, '1DZ9-9XynhHBj62e-_r9wAy3MQHOni85VCGnW6kgh8bI');
  assert.match(SLIDES_EMBED_URL, /docs\.google\.com\/presentation\/d\//);
  assert.match(SLIDES_EMBED_URL, new RegExp(CLASSROOM_DECK_ID));
  assert.match(SLIDES_EMBED_URL, /\/embed/);
  assert.match(SLIDES_EMBED_URL, /start=false/);
});

test('classroomEmbedUrl keeps free browse (no day slide lock)', () => {
  const url = classroomEmbedUrl(3);
  assert.match(url, new RegExp(CLASSROOM_DECK_ID));
  assert.match(url, /\/embed/);
  assert.doesNotMatch(url, /slide=id\./);
  // day hint is chrome-only; URL may carry rm=minimal but not day lock
  const u = new URL(url);
  assert.equal(u.searchParams.has('day'), false);
});

test('facilitator classroom UI hooks exist in main.jsx', async () => {
  const {readFileSync} = await import('node:fs');
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /ClassroomOverlay/);
  assert.match(main, /onOpenClassroom/);
  assert.match(main, /classroomOpen/);
  assert.match(main, />Classroom</);
  assert.match(main, /Exit Classroom/);
  assert.match(main, /keydown/);
  assert.match(main, /Escape/);
  assert.doesNotMatch(main, /vendor\/proof-sdk/);
});
