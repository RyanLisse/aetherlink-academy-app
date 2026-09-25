import {writeFileSync, mkdirSync} from 'node:fs';
import {FAIL, PASS, evaluateConfig, evaluateHealth, evaluateRevision, evaluateSsoStart, exitCodeFor, observedRevision, snapshot} from './deployed-smoke-checks.mjs';

const ssoMode = process.env.SMOKE_SSO === '1' || process.argv.includes('--sso');
mkdirSync('test-results', {recursive: true});
const writeEvidence = evidence => writeFileSync('test-results/deployed-smoke.json', JSON.stringify(evidence, null, 2) + '\n');
let base, publicUrl;
try {
  try { base = new URL(process.env.SMOKE_BASE_URL || process.argv.find(arg => /^https?:/.test(arg))); } catch { throw Error('SMOKE_BASE_URL is not a valid URL'); }
  if (!['https:', 'http:'].includes(base.protocol)) throw Error('Deployed checks require an http(s) URL');
  if (base.username || base.password) throw Error('Credentials must not be embedded in the URL');
  if (!/^[0-9a-f]{40}$/.test(process.env.EXPECTED_REVISION || '')) throw Error('EXPECTED_REVISION must be the full source commit SHA');
  try { publicUrl = new URL(process.env.SMOKE_PUBLIC_URL || base.origin); } catch { throw Error('SMOKE_PUBLIC_URL is not a valid URL'); }
} catch (error) {
  const detail = error.message;
  writeEvidence({at: new Date().toISOString(), checks: [{name: 'Valid Academy deployment metadata', passed: false, status: FAIL, detail}]});
  console.error(`FAIL: deployment metadata: ${detail}`);
  process.exit(1);
}
if (base.protocol === 'http:') console.warn(`WARN plain HTTP target ${base.origin}; this smoke sends no credentials, but TLS is not verified`);

const checks = [];
const record = result => {
  checks.push({...result, passed: result.status === PASS});
  const label = {pass: 'PASS', fail: 'FAIL', unavailable: 'NOT CONFIGURED'}[result.status];
  (result.status === PASS ? console.log : console.error)(`${label}: ${result.name}: ${result.detail}`);
};
const request = async (path, options = {}) =>
  snapshot(await fetch(new URL(path, base), {redirect: 'manual', signal: AbortSignal.timeout(15_000), ...options}));
const guarded = async (name, fn) => {
  try { await fn(); } catch (error) { record({name, status: FAIL, detail: `request failed: ${error.message}`}); }
};

let health, config;
await guarded('Academy and Proof ready', async () => {
  health = await request('/game/health');
  record(evaluateHealth(health));
  record(evaluateRevision(health, process.env.EXPECTED_REVISION));
});
await guarded('Application HTML available', async () => {
  const res = await request('/');
  const ok = res.status === 200 && /text\/html/.test(res.headers['content-type'] || '') && /id="root"/.test(res.body);
  record({name: 'Application HTML available', status: ok ? PASS : FAIL, detail: `/ HTTP ${res.status} ${res.headers['content-type'] || 'no content-type'}`});
});
await guarded('Public runtime config', async () => {
  config = await request('/game/config');
  record(evaluateConfig(config));
});
for (const path of ['/game/state', '/game/document', '/game/knowledge', '/mcp']) {
  for (const invalid of [false, true]) {
    const name = `${path} rejects ${invalid ? 'invalid' : 'missing'} credentials`;
    await guarded(name, async () => {
      const res = await request(path, invalid ? {headers: {Authorization: 'Bearer ci-invalid-credential'}} : {});
      record({name, status: [401, 403].includes(res.status) ? PASS : FAIL, detail: `HTTP ${res.status}`});
    });
  }
}
if (ssoMode) {
  await guarded('Facilitator Google login start', async () => {
    if (!config) throw Error('/game/config unavailable');
    const start = await request('/auth/google/start');
    record(evaluateSsoStart(config, start, {publicUrl, expectedClientId: process.env.EXPECTED_GOOGLE_CLIENT_ID || undefined}));
  });
}

writeEvidence({
  target: base.origin, at: new Date().toISOString(), sso: ssoMode,
  expectedRevision: process.env.EXPECTED_REVISION, observedRevision: health ? observedRevision(health) : null, checks,
});
console.log(`${checks.filter(c => c.passed).length}/${checks.length} deployed smoke checks passed`);
process.exitCode = exitCodeFor(checks);
