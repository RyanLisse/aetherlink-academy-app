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
const packageEn = JSON.parse(readFileSync(join(root, 'packages/i18n/src/en.json'), 'utf8'));
const packageNl = JSON.parse(readFileSync(join(root, 'packages/i18n/src/nl.json'), 'utf8'));

function teachOrder() {
  const block = main.slice(main.indexOf('teachNavIds=['), main.indexOf('];', main.indexOf('teachNavIds=[')) + 2);
  return [...block.matchAll(/\['(\w+)'/g)].map((m) => m[1]);
}

test('facilitator teach order remains unchanged', () => {
  assert.deepEqual(teachOrder(), ['squad', 'route', 'lesson', 'solo', 'coach', 'review', 'debrief']);
  assert.match(main, /data-testid="nav-primary"/);
  assert.match(main, /data-nav-tier="teach"/);
});

test('F2 Apps demoted out of learner primary', () => {
  const teach = main.slice(main.indexOf('teachNavIds=['), main.indexOf('toolNavIds=['));
  assert.doesNotMatch(teach, /nav\.apps|'apps'/);
  assert.match(main, /facilitator&&<button[^>]*data-nav="apps"/);
  assert.match(main, /data-testid="nav-tools-apps"/);
});

test('F3 portal kept via facilitator Tools entry (AppsLauncher preserved)', () => {
  assert.match(main, /import \{AppsLauncher\} from '\.\/portal\/AppsLauncher\.jsx'/);
  assert.match(main, /view==='apps'&&<AppsLauncher/);
  assert.match(main, /data-testid="nav-tools-apps"/);
});

test('F4 Labs stay under Lesson (no Labs nav / no Apps conflation)', () => {
  assert.doesNotMatch(main, /\['labs'/);
  assert.doesNotMatch(teachOrder().join(','), /lab/i);
  const lesson = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
  assert.match(lesson, /LabEmbed|lab/i);
  // AET-116 Slice 0: concept sims are also under Lesson (sibling slot), not a nav item
  assert.match(lesson, /ConceptSimSlot/);
  assert.doesNotMatch(main, /\['sims'/);
});

test('F5 tertiary Tools quieter than teach-path', () => {
  assert.match(main, /data-testid="nav-tools"/);
  assert.match(main, /nav-tools-label/);
  assert.match(css, /\.nav-tools\{/);
  assert.match(css, /nav-tools-label/);
  assert.match(css, /border-top:1px solid var\(--border\)/);
  const tools = main.slice(main.indexOf('toolNavIds=['), main.indexOf('];', main.indexOf('toolNavIds=[')) + 2);
  assert.match(tools, /naslag/);
  assert.match(tools, /decks/);
});

test('F6 density: primary ≤7 teach items; Apps not peer', () => {
  assert.equal(teachOrder().length, 7);
  assert.doesNotMatch(main.slice(main.indexOf('teachNavIds=['), main.indexOf('toolNavIds=[')), /LayoutGrid/);
});

test('F7 role gates: course / board / apps facilitator; certificate learner cohort', () => {
  assert.match(main, /facilitator&&<button[^>]*data-nav="course"/);
  assert.match(main, /\(facilitator\|\|room\.board\)&&<button[^>]*data-nav="board"/);
  assert.match(main, /facilitator&&<button[^>]*data-nav="apps"/);
  assert.match(main, /!facilitator&&room\.me\.cohortMemberId&&<button[^>]*data-nav="certificate"/);
});

test('F8 regression gates: AET-110 shell + AppsLauncher + board open path intact', () => {
  assert.match(main, /facilitator-teach/);
  assert.match(main, /facilitator-dials/);
  assert.match(main, /classroom\.open/);
  assert.match(main, /classroomEmbedUrl\(room\.day,/);
  assert.match(main, /AppsLauncher/);
  assert.match(main, /api\('board',\{action:'open'\}/);
  assert.doesNotMatch(main, /learnhouse/i);
});

test('AET-115 i18n EN+NL for teach/tools/portal/learner debrief', () => {
  for (const key of ['nav.teach', 'nav.tools', 'nav.apps', 'debrief.learnerTitle', 'debrief.learnerHelp']) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
  assert.match(en['nav.apps'], /portal|OpenShip/i);
  assert.doesNotMatch(en['nav.apps'], /^Apps$/);
  assert.match(en['nav.tools'], /Tools/i);
  assert.match(nl['nav.tools'], /Tools/i);
});

test('participant navigation labels are translated in EN and NL', () => {
  for (const key of ['participant.more', 'participant.squadHelp']) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
    assert.equal(packageEn[key], en[key], `package translation differs for EN ${key}`);
    assert.equal(packageNl[key], nl[key], `package translation differs for NL ${key}`);
  }
});
