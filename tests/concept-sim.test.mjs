import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {createApp} from '../server/app.mjs';
import {getSim,listSims,resolvePackSims,loadSimCatalog} from '../server/sims.mjs';
import {parseScenario} from '../packages/concept-sim/src/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const concept = readFileSync(join(root, 'src/ConceptSim.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
const pkgEn = JSON.parse(readFileSync(join(root, 'packages/i18n/src/en.json'), 'utf8'));
const authoring = readFileSync(join(root, 'docs/LESSON-AUTHORING.md'), 'utf8');
const prTemplate = readFileSync(join(root, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf8');
const fixture = JSON.parse(readFileSync(join(root, 'content/sims/fixture-agent-loop.json'), 'utf8'));

test('B1 authoring checklist lists five required elements incl. locale-complete', () => {
  assert.match(authoring, /One mechanism/i);
  assert.match(authoring, /Mental-model narrative/i);
  assert.match(authoring, /explanatory diagram/i);
  assert.match(authoring, /Concept simulation|step-through/i);
  assert.match(authoring, /Locale-complete content/i);
  assert.match(authoring, /learn\.shareai\.run/);
  assert.match(authoring, /content\/sims/);
  assert.match(authoring, /silent EN leak/i);
});

test('B2 PR template references lesson authoring checklist', () => {
  assert.match(prTemplate, /LESSON-AUTHORING/);
  assert.match(prTemplate, /Concept sim/);
  assert.match(prTemplate, /learn\.shareai\.run/);
});

test('Slice 0 surface: ConceptSim is first-class in Lesson (not iframe learn.shareai.run)', () => {
  assert.match(panels, /ConceptSimSlot/);
  assert.match(panels, /pack\.sims/);
  assert.match(concept, /data-testid="concept-sim"/);
  assert.match(concept, /data-testid="sim-step"/);
  assert.doesNotMatch(concept, /learn\.shareai\.run/);
  assert.doesNotMatch(panels, /learn\.shareai\.run/);
  assert.match(css, /\.concept-sim\{/);
});

test('AET-115 Labs stay under Lesson; sims are sibling slot not Labs nav', () => {
  const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
  assert.doesNotMatch(main, /\['labs'/);
  assert.match(panels, /LabEmbed/);
  assert.match(panels, /ConceptSimSlot/);
});

test('i18n sim keys present EN+NL with package parity', () => {
  const keys = [
    'sim.heading','sim.help','sim.play','sim.pause','sim.step','sim.reset',
    'sim.speed','sim.progress','sim.startHint','sim.complete','sim.emptyResult',
    'sim.type.user','sim.type.assistant','sim.type.toolCall','sim.type.toolResult','sim.type.system',
  ];
  for (const key of keys) {
    assert.equal(typeof en[key], 'string', key);
    assert.equal(typeof nl[key], 'string', key);
    assert.equal(pkgEn[key], en[key], key);
  }
});

test('fixture scenario parses and is in catalog', () => {
  const scenario = parseScenario(fixture);
  assert.equal(scenario.version, 'fixture-agent-loop');
  assert.ok(scenario.steps.length >= 4);
  assert.equal(getSim('fixture-agent-loop')?.title, scenario.title);
  assert.ok(listSims().some((s) => s.id === 'fixture-agent-loop'));
  const resolved = resolvePackSims([{id: 'fixture-agent-loop', title: 'Demo'}]);
  assert.equal(resolved[0].title, 'Demo');
  assert.equal(resolved[0].steps.length, scenario.steps.length);
});

test('unknown sim id fails loudly', () => {
  assert.throws(() => resolvePackSims(['no-such-sim']), /unknown sim/);
});

async function invoke(app, route, {method = 'GET', body, cookies = {}} = {}) {
  const layer = app.router.stack.find((candidate) => candidate.route?.path === route);
  assert.ok(layer, `Missing route ${route}`);
  const response = {statusCode: 200, body: null};
  const req = {
    method,
    body,
    query: {},
    headers: {cookie: Object.entries(cookies).map(([n, v]) => `${n}=${v}`).join('; ')},
  };
  const res = {
    status(status) { response.statusCode = status; return this; },
    json(value) { response.body = value; return this; },
    end() { return this; },
  };
  await layer.route.stack[0].handle(req, res, (error) => {
    response.statusCode = error.status || 500;
    response.body = {error: error.status ? error.message : 'Onverwachte serverfout.'};
  });
  return response;
}

test('day-pack includes resolved sims; sim-catalog lists fixture', async () => {
  const instance = createApp({
    dir: mkdtempSync(path.join(os.tmpdir(), 'academy-concept-sim-')),
    hostKey: 'test-host',
    publicBaseUrl: 'https://academy.example',
  });
  const host = instance.store.create('Sims', {slug: 'sims'});
  const ada = instance.store.join(host.code, 'Ada');
  const cookies = {academy: ada.token};
  const app = instance.app;

  const catalog = await invoke(app, '/game/sim-catalog', {cookies});
  assert.equal(catalog.statusCode, 200);
  assert.ok(catalog.body.sims.some((s) => s.id === 'fixture-agent-loop'));

  const pack = await invoke(app, '/game/day-pack', {cookies});
  assert.equal(pack.statusCode, 200);
  assert.ok(Array.isArray(pack.body.sims));
  assert.ok(pack.body.sims.some((s) => s.id === 'fixture-agent-loop'));
  assert.ok(pack.body.sims[0].steps.length >= 4);
  assert.equal(typeof pack.body.sims[0].steps[0].annotation, 'string');
});

test('catalog loader rejects path-traversal filenames via isValidSimId gate', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'academy-bad-sims-'));
  // empty dir loads fine
  assert.equal(loadSimCatalog(dir).size, 0);
});

test('Harness sims s01–s17 parse and catalog in EN+NL', async () => {
  const {parseLocalizedScenario, projectScenario, assertScenarioLocaleComplete} = await import('../packages/concept-sim/src/index.ts');
  const ids = Array.from({length: 17}, (_, i) => `s${String(i + 1).padStart(2, '0')}`);
  for (const id of ids) {
    const raw = JSON.parse(readFileSync(join(root, `content/sims/${id}.json`), 'utf8'));
    const localized = parseLocalizedScenario(raw, id);
    assertScenarioLocaleComplete(localized, id);
    const en = projectScenario(localized, 'en');
    const nl = projectScenario(localized, 'nl');
    assert.equal(en.version, id);
    assert.ok(en.steps.length >= 4, id);
    assert.ok(nl.steps.length >= 4, id);
    // Titles may share English mechanism names (Hooks); step/annotation copy must differ.
    assert.notEqual(
      JSON.stringify(en.steps.map((s) => s.content + s.annotation)),
      JSON.stringify(nl.steps.map((s) => s.content + s.annotation)),
      `${id} step copy localized`,
    );
    assert.match(en.attribution || '', /shareAI-lab\/learn-claude-code/);
    assert.equal(getSim(id, 'en')?.title, en.title);
    assert.equal(getSim(id, 'nl')?.title, nl.title);
  }
  assert.equal(listSims('nl').filter((s) => /^s\d{2}$/.test(s.id) && s.localeComplete).length, 17);
});

test('Harness day packs declare diagram + sim + MIT + real EN/NL', async () => {
  const {DAY_PACKS} = await import('../content/days/index.mjs');
  const {projectPackLocale} = await import('../content/days/locale.mjs');
  const byDay = Object.fromEntries(DAY_PACKS.map((p) => [p.day, p]));
  const pairs = Array.from({length: 17}, (_, i) => [8 + i, `s${String(i + 1).padStart(2, '0')}`]);
  for (const [day, simId] of pairs) {
    const pack = byDay[day];
    assert.ok(pack, `missing day ${day}`);
    assert.equal(pack.localeComplete, true);
    assert.ok(pack.copy?.en && pack.copy?.nl, `day ${day} copy`);
    const en = projectPackLocale(pack, 'en');
    const nl = projectPackLocale(pack, 'nl');
    assert.notEqual(en.lesson.title, nl.lesson.title);
    assert.notEqual(en.lesson.narrative[0], nl.lesson.narrative[0]);
    assert.ok(en.diagrams?.length >= 1);
    assert.ok(en.sims?.some((s) => s.id === simId));
    assert.match(en.attribution || '', /MIT/);
    for (const d of en.diagrams) {
      assert.ok(d.src.startsWith('/diagrams/harness/'));
      assert.ok(existsSync(join(root, 'public', d.src.replace(/^\//, ''))), d.src);
    }
  }
  assert.ok(byDay[1].sims?.some((s) => s.id === 'fixture-agent-loop'));
});

test('AET-118 P0 W5 retrofit: diagram + ConceptSim + locale-complete; Apple bar kept', async () => {
  const {DAY_PACKS} = await import('../content/days/index.mjs');
  const {projectPackLocale} = await import('../content/days/locale.mjs');
  const {parseLocalizedScenario, projectScenario, assertScenarioLocaleComplete} = await import('../packages/concept-sim/src/index.ts');
  const pack = DAY_PACKS.find((p) => p.day === 5);
  assert.ok(pack, 'day 5 pack');
  assert.equal(pack.kind, 'workshop');
  assert.equal(pack.localeComplete, true);
  assert.ok(pack.copy?.en && pack.copy?.nl, 'W5 copy en+nl');

  const en = projectPackLocale(pack, 'en');
  const nl = projectPackLocale(pack, 'nl');
  assert.notEqual(en.lesson.narrative[0], nl.lesson.narrative[0]);
  assert.match(en.lesson.motto || '', /Human gates/i);
  assert.match(nl.lesson.motto || '', /Menselijke gates/i);
  assert.ok(en.diagrams?.some((d) => d.src === '/diagrams/workshop/w5-harness-loop.svg'));
  assert.ok(existsSync(join(root, 'public/diagrams/workshop/w5-harness-loop.svg')));
  assert.ok(en.sims?.some((s) => s.id === 'w5-sdlc-loop'));
  assert.ok(nl.sims?.some((s) => s.id === 'w5-sdlc-loop'));

  // Apple bar / pedagogy vehicles kept
  assert.equal(en.demo?.slides?.length, 7);
  assert.equal(en.steps?.length, 7);
  assert.ok(en.materials?.some((m) => /aetherlink-daily-brief-lab-s1/.test(m.href || '')));
  assert.ok(nl.materials?.some((m) => /aetherlink-daily-brief-lab-s1/.test(m.href || '')));

  const raw = JSON.parse(readFileSync(join(root, 'content/sims/w5-sdlc-loop.json'), 'utf8'));
  const localized = parseLocalizedScenario(raw, 'w5-sdlc-loop');
  assertScenarioLocaleComplete(localized, 'w5-sdlc-loop');
  const simEn = projectScenario(localized, 'en');
  const simNl = projectScenario(localized, 'nl');
  assert.ok(simEn.steps.length >= 8);
  assert.ok(simNl.steps.length >= 8);
  assert.notEqual(
    JSON.stringify(simEn.steps.map((s) => s.content + s.annotation)),
    JSON.stringify(simNl.steps.map((s) => s.content + s.annotation)),
  );
  assert.ok(simEn.steps.some((s) => s.type === 'system_event' && /HUMAN GATE/i.test(s.content)));
  assert.ok(simNl.steps.some((s) => s.type === 'system_event' && /MENSELIJKE GATE/i.test(s.content)));
  assert.equal(getSim('w5-sdlc-loop', 'en')?.title, simEn.title);
  assert.equal(getSim('w5-sdlc-loop', 'nl')?.title, simNl.title);
});
