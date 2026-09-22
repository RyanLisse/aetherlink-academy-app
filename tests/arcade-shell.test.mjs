import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
  parseLessonMarkdown,
  matchArcadeRoute,
  isArcadePath,
  normalizePath,
  resolveSoloLessonId,
  soloLessonsForRoute,
  DEFAULT_SOLO_LESSON_ID,
} from '../src/arcade/parse.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'content/arcade/arcade-manifest.json'), 'utf8'));
const weather = readFileSync(path.join(root, 'content/arcade/l1-weather.md'), 'utf8');
const council = readFileSync(path.join(root, 'content/arcade/l2-council.md'), 'utf8');
const sdk = readFileSync(path.join(root, 'content/arcade/sdk-bridge.md'), 'utf8');
const soloIds = (manifest.soloLessons || []).map((s) => s.id);

test('manifest lists three arcade lessons with expected routes', () => {
  assert.equal(manifest.id, 'agent-arcade');
  assert.equal(manifest.lessons.length, 3);
  const routes = manifest.lessons.map((l) => l.route).sort();
  assert.deepEqual(routes, ['/arcade/council', '/arcade/sdk-bridge', '/arcade/weather']);
});

test('manifest solo lessons use exact LESSON-ID-CONTRACT ids', () => {
  assert.equal(manifest.routes.solo, '/arcade/solo');
  assert.equal(manifest.soloDefaultLesson, 'ws-1-eve-weather');
  assert.equal(manifest.soloPlayerBase, '/arcade-lab/');
  const expected = [
    'ws-1-eve-weather',
    'ws-2-eve-state',
    'ws-3-eve-approval',
    'ws-2-eve-council',
    'ws-5-sdk-quickstart',
    'ws-3-sdk-weather',
    'ws-7-sdk-hooks',
    'ws-8-sdk-subagents',
    'ws-4-sdk-council',
    'sample-counter',
  ];
  for (const id of expected) {
    assert.ok(soloIds.includes(id), `missing solo id ${id}`);
  }
  assert.ok(existsSync(path.join(root, 'content/arcade/facilitator-solo-note.md')));
});

test('matchArcadeRoute hub lessons and solo', () => {
  assert.equal(matchArcadeRoute(manifest, '/arcade').kind, 'hub');
  assert.equal(matchArcadeRoute(manifest, '/arcade/').kind, 'hub');
  assert.equal(matchArcadeRoute(manifest, '/arcade/solo').kind, 'solo');
  assert.equal(matchArcadeRoute(manifest, '/arcade/weather').kind, 'lesson');
  assert.equal(matchArcadeRoute(manifest, '/arcade/weather').lesson.id, 'l1-weather');
  assert.equal(matchArcadeRoute(manifest, '/arcade/council').lesson.id, 'l2-council');
  assert.equal(matchArcadeRoute(manifest, '/arcade/sdk-bridge').lesson.id, 'sdk-bridge');
  assert.equal(matchArcadeRoute(manifest, '/arcade/facilitator').kind, 'facilitator');
  assert.equal(matchArcadeRoute(manifest, '/nope').kind, 'unknown');
});

test('resolveSoloLessonId soft-fail contract', () => {
  assert.equal(DEFAULT_SOLO_LESSON_ID, 'ws-1-eve-weather');
  assert.deepEqual(resolveSoloLessonId(null, soloIds), {id: 'ws-1-eve-weather', reason: 'missing'});
  assert.deepEqual(resolveSoloLessonId('', soloIds), {id: 'ws-1-eve-weather', reason: 'missing'});
  assert.deepEqual(resolveSoloLessonId('ws-1', soloIds), {id: 'ws-1-eve-weather', reason: 'unknown'});
  assert.deepEqual(resolveSoloLessonId('ws-2-eve-council', soloIds), {id: 'ws-2-eve-council', reason: 'exact'});
});

test('soloLessonsForRoute maps weather/council/sdk-bridge', () => {
  const weatherIds = soloLessonsForRoute(manifest, '/arcade/weather').map((s) => s.id);
  assert.deepEqual(weatherIds, ['ws-1-eve-weather', 'ws-2-eve-state', 'ws-3-eve-approval']);
  const councilIds = soloLessonsForRoute(manifest, '/arcade/council').map((s) => s.id);
  assert.ok(councilIds.includes('ws-2-eve-council'));
  assert.ok(councilIds.includes('ws-4-sdk-council'));
  const sdkIds = soloLessonsForRoute(manifest, '/arcade/sdk-bridge').map((s) => s.id);
  assert.deepEqual(sdkIds, ['ws-5-sdk-quickstart', 'ws-3-sdk-weather', 'ws-7-sdk-hooks', 'ws-8-sdk-subagents']);
});

test('isArcadePath', () => {
  assert.equal(isArcadePath('/arcade'), true);
  assert.equal(isArcadePath('/arcade/weather'), true);
  assert.equal(isArcadePath('/arcade/solo'), true);
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

test('parse council + sdk bridge; sdk starters available', () => {
  const c = parseLessonMarkdown(council);
  assert.ok(c.steps.length >= 3);
  const s = parseLessonMarkdown(sdk);
  assert.ok(s.steps.length >= 3);
  const sdkLesson = manifest.lessons.find((l) => l.id === 'sdk-bridge');
  assert.equal(String(sdkLesson.startersStatus).toLowerCase(), 'available');
  assert.doesNotMatch(String(sdkLesson.startersStatus), /PENDING/i);
  const ids = (sdkLesson.starters || []).map((x) => x.id).sort();
  assert.deepEqual(ids, ['council-agent-sdk', 'weather-agent-sdk']);
  for (const starter of sdkLesson.starters) {
    assert.match(starter.cloneUrl, /^https:\/\/github\.com\/RyanLisse\//);
  }
});

test('ArcadeApp renders solo shell + start solo CTA', () => {
  const arcadeApp = readFileSync(path.join(root, 'src/arcade/ArcadeApp.jsx'), 'utf8');
  assert.match(arcadeApp, /startersAreAvailable|data-starters-status="available"/);
  assert.match(arcadeApp, /StartersReadyPanel|SDK starters ready/);
  assert.match(arcadeApp, /Start solo/);
  assert.match(arcadeApp, /SoloShell/);
  assert.match(arcadeApp, /arcade-lab/);
  assert.match(arcadeApp, /facilitatorSoloNote|facilitator-solo-note/);
  assert.match(arcadeApp, /Mensentaal/);
  assert.doesNotMatch(arcadeApp, /Hands-on SDK labs wachten op Herdr <strong>LIS-65<\/strong>/);
});

test('main.jsx wires ArcadeApp on /arcade paths', () => {
  const main = readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
  assert.match(main, /ArcadeApp/);
  assert.match(main, /isArcadePath/);
  const style = readFileSync(path.join(root, 'src/style.css'), 'utf8');
  const arcadeApp = readFileSync(path.join(root, 'src/arcade/ArcadeApp.jsx'), 'utf8');
  assert.ok(style.includes('arcade/arcade.css') || arcadeApp.includes('arcade.css'));
});

test('server SPA-fallback includes /arcade and serves /arcade-lab', () => {
  const app = readFileSync(path.join(root, 'server/app.mjs'), 'utf8');
  assert.match(app, /\/arcade/);
  assert.match(app, /sendFile/);
  assert.match(app, /arcade-lab/);
  assert.match(app, /apps\/arcade-lab\/dist/);
});

test('arcade-lab vite base is /arcade-lab/', () => {
  const vite = readFileSync(path.join(root, 'apps/arcade-lab/vite.config.ts'), 'utf8');
  assert.match(vite, /base:\s*['"]\/arcade-lab\/['"]/);
  const main = readFileSync(path.join(root, 'apps/arcade-lab/src/main.ts'), 'utf8');
  assert.match(main, /styles\.css/);
});

test('day packs content file untouched by arcade ids', () => {
  const content = readFileSync(path.join(root, 'server/content.mjs'), 'utf8');
  assert.doesNotMatch(content, /agent-arcade|l1-weather|sdk-bridge/);
  assert.match(content, /getDayPack|day1|Day/);
});
