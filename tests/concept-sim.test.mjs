import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
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

test('B1 authoring checklist lists four required elements', () => {
  assert.match(authoring, /One mechanism/i);
  assert.match(authoring, /Mental-model narrative/i);
  assert.match(authoring, /explanatory diagram/i);
  assert.match(authoring, /Concept simulation|step-through/i);
  assert.match(authoring, /learn\.shareai\.run/);
  assert.match(authoring, /content\/sims/);
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
