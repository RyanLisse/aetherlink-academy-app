import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parseLessonMarkdown, matchArcadeRoute, isArcadePath, normalizePath} from '../src/arcade/parse.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'content/arcade/arcade-manifest.json'), 'utf8'));
const weather = readFileSync(path.join(root, 'content/arcade/l1-weather.md'), 'utf8');
const council = readFileSync(path.join(root, 'content/arcade/l2-council.md'), 'utf8');
const sdk = readFileSync(path.join(root, 'content/arcade/sdk-bridge.md'), 'utf8');

test('manifest lists three arcade lessons with expected routes', () => {
  assert.equal(manifest.id, 'agent-arcade');
  assert.equal(manifest.lessons.length, 3);
  const routes = manifest.lessons.map((l) => l.route).sort();
  assert.deepEqual(routes, ['/arcade/council', '/arcade/sdk-bridge', '/arcade/weather']);
});

test('matchArcadeRoute hub and lessons', () => {
  assert.equal(matchArcadeRoute(manifest, '/arcade').kind, 'hub');
  assert.equal(matchArcadeRoute(manifest, '/arcade/').kind, 'hub');
  assert.equal(matchArcadeRoute(manifest, '/arcade/weather').kind, 'lesson');
  assert.equal(matchArcadeRoute(manifest, '/arcade/weather').lesson.id, 'l1-weather');
  assert.equal(matchArcadeRoute(manifest, '/arcade/council').lesson.id, 'l2-council');
  assert.equal(matchArcadeRoute(manifest, '/arcade/sdk-bridge').lesson.id, 'sdk-bridge');
  assert.equal(matchArcadeRoute(manifest, '/arcade/facilitator').kind, 'facilitator');
  assert.equal(matchArcadeRoute(manifest, '/nope').kind, 'unknown');
});

test('isArcadePath', () => {
  assert.equal(isArcadePath('/arcade'), true);
  assert.equal(isArcadePath('/arcade/weather'), true);
  assert.equal(isArcadePath('/'), false);
  assert.equal(isArcadePath('/lesson'), false);
  assert.equal(normalizePath('/arcade/weather/'), '/arcade/weather');
});

test('parse weather lesson yields dual captions + checkpoints', () => {
  const parsed = parseLessonMarkdown(weather);
  assert.match(parsed.title, /Weather/i);
  assert.ok(parsed.steps.length >= 5);
  const withCp = parsed.steps.filter((s) => s.checkpoint);
  assert.ok(withCp.length >= 4);
  assert.ok(withCp.every((s) => s.expected));
  assert.ok(parsed.steps.some((s) => s.coach.mensentaal && s.coach.tech));
  const ids = withCp.map((s) => s.checkpoint);
  for (const id of manifest.lessons.find((l) => l.id === 'l1-weather').checkpoints) {
    assert.ok(ids.includes(id), `missing checkpoint ${id}`);
  }
});

test('parse council + sdk bridge; sdk has pending starters', () => {
  const c = parseLessonMarkdown(council);
  assert.ok(c.steps.length >= 3);
  const s = parseLessonMarkdown(sdk);
  assert.ok(s.steps.length >= 3);
  const sdkLesson = manifest.lessons.find((l) => l.id === 'sdk-bridge');
  assert.match(String(sdkLesson.startersStatus), /PENDING/i);
});

test('main.jsx wires ArcadeApp on /arcade paths', () => {
  const main = readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
  assert.match(main, /ArcadeApp/);
  assert.match(main, /isArcadePath/);
  const style = readFileSync(path.join(root, 'src/style.css'), 'utf8');
  const arcadeApp = readFileSync(path.join(root, 'src/arcade/ArcadeApp.jsx'), 'utf8');
  assert.ok(style.includes('arcade/arcade.css') || arcadeApp.includes('arcade.css'));
});

test('server SPA-fallback includes /arcade', () => {
  const app = readFileSync(path.join(root, 'server/app.mjs'), 'utf8');
  assert.match(app, /\/arcade/);
  assert.match(app, /sendFile/);
});

test('day packs content file untouched by arcade ids', () => {
  const content = readFileSync(path.join(root, 'server/content.mjs'), 'utf8');
  assert.doesNotMatch(content, /agent-arcade|l1-weather|sdk-bridge/);
  assert.match(content, /getDayPack|day1|Day/);
});
