import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtempSync, readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {evaluateConfig, evaluateHealth, evaluateRevision, evaluateSsoStart, exitCodeFor} from '../scripts/deployed-smoke-checks.mjs';
import {evaluateCurriculumDay, moduleScripts, probeCurriculum, CURRICULUM} from '../scripts/deployed-curriculum.mjs';

const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/deployed/${name}.json`, import.meta.url), 'utf8')).response;
const withBody = (response, body) => ({...response, body});
const prod = {health: fixture('health'), config: fixture('config'), ssoDisabled: fixture('sso-start-disabled'), shell: fixture('web-shell'), bundle: fixture('web-bundle-excerpt')};
const configured = fixture('sso-start-configured');
const enabledConfig = withBody(prod.config, '{"googleSso":true,"portal":true,"portalLaunch":true}');
const SHA = 'a'.repeat(40);

test('prod health is ready but its null revision fails the revision check', () => {
  assert.deepEqual(evaluateHealth(prod.health), {name: 'Academy and Proof ready', status: 'pass', detail: 'ok=true proof=true'});
  assert.deepEqual(evaluateRevision(prod.health, SHA), {
    name: 'Deployed revision matches EXPECTED_REVISION', status: 'fail',
    detail: '/game/health reports no revision (null); set SOURCE_REVISION on the deployed process',
  });
});

test('revision check separates mismatch from match', () => {
  const deployed = withBody(prod.health, JSON.stringify({ok: true, proof: true, revision: 'b'.repeat(40)}));
  assert.equal(evaluateRevision(deployed, SHA).detail, `revision mismatch: deployed ${'b'.repeat(40)}, expected ${SHA}`);
  assert.equal(evaluateRevision(deployed, 'b'.repeat(40)).status, 'pass');
});

test('health fails when Proof is down', () => {
  const down = withBody(prod.health, '{"ok":true,"proof":false,"revision":null}');
  assert.equal(evaluateHealth(down).detail, '/game/health proof is not true (Proof sidecar unreachable)');
});

test('prod /game/config reports its flags', () => {
  assert.deepEqual(evaluateConfig(prod.config), {name: 'Public runtime config', status: 'pass', detail: 'googleSso=false portal=true portalLaunch=true'});
  assert.equal(evaluateConfig(withBody(prod.config, '<html>')).detail, '/game/config missing boolean googleSso, portal, portalLaunch');
});

test('prod SSO is reported as not configured, which fails closed with exit 2', () => {
  const result = evaluateSsoStart(prod.config, prod.ssoDisabled, {publicUrl: 'http://91.99.78.17:4317'});
  assert.deepEqual(result, {
    name: 'Facilitator Google login start', status: 'unavailable',
    detail: 'not configured: /game/config googleSso=false and /auth/google/start redirects to /?login_error=disabled',
  });
  assert.equal(exitCodeFor([evaluateConfig(prod.config), result]), 2);
});

test('configured SSO start passes with the Google client and callback shape', () => {
  assert.deepEqual(evaluateSsoStart(enabledConfig, configured, {publicUrl: 'https://academy.example.test'}), {
    name: 'Facilitator Google login start', status: 'pass',
    detail: 'redirects to accounts.google.com client_id=000000000000-placeholder.apps.googleusercontent.com redirect_uri=https://academy.example.test/auth/google/callback',
  });
});

test('configured SSO start reports broken shapes', () => {
  assert.equal(evaluateSsoStart(enabledConfig, configured, {publicUrl: 'http://91.99.78.17:4317'}).detail,
    'broken: redirect_uri "https://academy.example.test/auth/google/callback", expected http://91.99.78.17:4317/auth/google/callback');
  assert.equal(evaluateSsoStart(enabledConfig, configured, {publicUrl: 'https://academy.example.test', expectedClientId: 'other.apps.googleusercontent.com'}).detail,
    'broken: client_id "000000000000-placeholder.apps.googleusercontent.com" differs from EXPECTED_GOOGLE_CLIENT_ID');
  const noCookie = {...configured, headers: {location: configured.headers.location}};
  assert.equal(evaluateSsoStart(enabledConfig, noCookie, {publicUrl: 'https://academy.example.test'}).detail, 'broken: academy-login state cookie not set');
  const discoveryFailed = {...prod.ssoDisabled, headers: {location: '/?login_error=verify'}};
  assert.equal(evaluateSsoStart(enabledConfig, discoveryFailed, {publicUrl: 'https://academy.example.test'}).detail, 'broken: /auth/google/start redirects to /?login_error=verify');
  assert.equal(evaluateSsoStart(enabledConfig, prod.ssoDisabled, {publicUrl: 'https://academy.example.test'}).status, 'fail');
  assert.equal(evaluateSsoStart(prod.config, configured, {publicUrl: 'https://academy.example.test'}).detail, 'broken: /game/config googleSso=false but /auth/google/start redirects to Google');
});

test('unexpected health and start responses fail instead of crashing', () => {
  assert.equal(evaluateHealth({status: 502, headers: {}, body: 'Bad Gateway'}).detail, '/game/health HTTP 502');
  assert.equal(evaluateHealth(withBody(prod.health, '<html>')).detail, '/game/health ok is not true');
  const opts = {publicUrl: 'https://academy.example.test'};
  assert.equal(evaluateSsoStart(enabledConfig, {status: 500, headers: {}, body: ''}, opts).detail, 'broken: /auth/google/start HTTP 500, expected 302');
  assert.equal(evaluateSsoStart(enabledConfig, {status: 302, headers: {location: 'https://evil.example/o/oauth2'}, body: ''}, opts).detail,
    'broken: /auth/google/start redirects to https://evil.example, expected https://accounts.google.com');
  assert.equal(evaluateSsoStart(enabledConfig, {status: 302, headers: {location: 'http://['}, body: ''}, opts).detail, 'broken: unparseable Location "http://["');
});

test('exit codes rank failure above not-available', () => {
  assert.deepEqual([[], [{status: 'pass'}], [{status: 'unavailable'}], [{status: 'unavailable'}, {status: 'fail'}]].map(exitCodeFor), [0, 0, 2, 1]);
});

test('prod bundle serves all seven curriculum days', () => {
  assert.deepEqual(CURRICULUM.map(day => evaluateCurriculumDay(day, prod.shell, prod.bundle.body).detail), [
    '/classroom/1 served by the apps/web bundle', '/classroom/2 served by the apps/web bundle',
    '/workshop/3 served by the apps/web bundle', '/workshop/4 served by the apps/web bundle', '/workshop/5 served by the apps/web bundle',
    '/workshop/6 served by the apps/web bundle', '/workshop/7 served by the apps/web bundle',
  ]);
});

test('a day missing from the bundle is not yet available, and a missing build fails', () => {
  const withoutDay7 = prod.bundle.body.replaceAll('"/workshop/7"', '"/workshop/x"');
  assert.deepEqual(evaluateCurriculumDay(CURRICULUM[6], prod.shell, withoutDay7), {
    name: 'curriculum_day_7_workshop', status: 'unavailable', detail: 'not yet available: the deployed apps/web bundle has no /workshop/7 route',
  });
  const notBuilt = {status: 503, headers: {'content-type': 'text/plain'}, body: 'apps/web not built'};
  assert.equal(evaluateCurriculumDay(CURRICULUM[0], notBuilt, '').detail, '/classroom/1 HTTP 503: apps/web not built');
});

function serve(routes) {
  const server = createServer((req, res) => {
    const route = routes[new URL(req.url, 'http://x').pathname];
    if (!route) { res.writeHead(404).end(); return; }
    const response = typeof route === 'function' ? route(req) : route;
    res.writeHead(response.status, response.headers).end(response.body);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({server, origin: `http://127.0.0.1:${server.address().port}`})));
}

const shellRoutes = Object.fromEntries(CURRICULUM.map(day => [day.route, prod.shell]));

test('probeCurriculum reads the shell and bundle over HTTP', async () => {
  const bundleWithoutClassroom2 = {...prod.bundle, body: prod.bundle.body.replaceAll('"/classroom/2"', '""')};
  const {server, origin} = await serve({...shellRoutes, '/academy-assets/index-DNSZwLFd.js': bundleWithoutClassroom2});
  try {
    const results = await probeCurriculum(new URL(origin));
    assert.deepEqual(results.map(r => `${r.name}=${r.status}`), [
      'curriculum_day_1_classroom=pass', 'curriculum_day_2_classroom=unavailable', 'curriculum_day_3_workshop=pass',
      'curriculum_day_4_workshop=pass', 'curriculum_day_5_workshop=pass', 'curriculum_day_6_workshop=pass', 'curriculum_day_7_workshop=pass',
    ]);
  } finally { server.close(); }
});

test('probeCurriculum fails every day when the bundle is missing', async () => {
  const {server, origin} = await serve(shellRoutes);
  try {
    const results = await probeCurriculum(new URL(origin));
    assert.deepEqual(results.map(r => `${r.status} ${r.detail}`), CURRICULUM.map(day => `fail ${day.route}: bundle /academy-assets/index-DNSZwLFd.js HTTP 404`));
  } finally { server.close(); }
});

test('a route literal in a modulepreload chunk or single quotes counts as served', () => {
  const shell = withBody(prod.shell, prod.shell.body.replace('</head>', '<link rel="modulepreload" href="/academy-assets/w7.js"></head>'));
  assert.deepEqual(moduleScripts(shell.body), ['/academy-assets/index-DNSZwLFd.js', '/academy-assets/w7.js']);
  assert.equal(evaluateCurriculumDay(CURRICULUM[6], shell, "p==='/workshop/7'").status, 'pass');
});

const smoke = path.resolve(import.meta.dirname, '../scripts/deployed-smoke.mjs');
async function runSmoke(origin, env) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'deployed-smoke-'));
  const {code, stderr} = await promisify(execFile)(process.execPath, [smoke], {cwd, env: {...process.env, SMOKE_BASE_URL: origin, EXPECTED_REVISION: SHA, ...env}})
    .then(out => ({code: 0, ...out}), error => ({code: error.code, stderr: error.stderr}));
  return {code, stderr, evidence: JSON.parse(readFileSync(path.join(cwd, 'test-results/deployed-smoke.json'), 'utf8'))};
}

test('smoke runner against recorded prod responses fails on revision and fails closed on SSO', async () => {
  const unauthorized = {status: 401, headers: {'content-type': 'application/json'}, body: '{"error":"unauthorized"}'};
  const deployedHealth = withBody(prod.health, JSON.stringify({ok: true, proof: true, revision: SHA}));
  const routes = {
    '/game/health': prod.health, '/game/config': prod.config, '/auth/google/start': prod.ssoDisabled,
    '/': {...prod.shell, headers: {'content-type': 'text/html; charset=utf-8'}},
    '/game/state': unauthorized, '/game/document': unauthorized, '/game/knowledge': unauthorized, '/mcp': unauthorized,
  };
  const {server, origin} = await serve(routes);
  try {
    const legacy = await runSmoke(origin, {SMOKE_SSO: ''});
    assert.equal(legacy.code, 1);
    assert.deepEqual(legacy.evidence.checks.filter(c => !c.passed).map(c => c.name), ['Deployed revision matches EXPECTED_REVISION']);
    assert.equal(legacy.evidence.checks.length, 12);

    routes['/game/health'] = deployedHealth;
    const sso = await runSmoke(origin, {SMOKE_SSO: '1'});
    assert.equal(sso.code, 2);
    assert.match(sso.stderr, /NOT CONFIGURED: Facilitator Google login start: not configured/);
    assert.deepEqual(sso.evidence.checks.at(-1), {
      name: 'Facilitator Google login start', status: 'unavailable', passed: false,
      detail: 'not configured: /game/config googleSso=false and /auth/google/start redirects to /?login_error=disabled',
    });
    assert.equal(sso.evidence.observedRevision, SHA);
  } finally { server.close(); }
});

test('smoke refuses a missing revision before any request', async () => {
  const {code, evidence} = await runSmoke('http://127.0.0.1:9', {EXPECTED_REVISION: ''});
  assert.equal(code, 1);
  assert.deepEqual(evidence.checks, [{name: 'Valid Academy deployment metadata', passed: false, status: 'fail', detail: 'EXPECTED_REVISION must be the full source commit SHA'}]);
});
