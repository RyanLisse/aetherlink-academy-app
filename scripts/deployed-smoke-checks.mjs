// Pure evaluators for the deployed smoke. Each takes recorded HTTP snapshots
// ({status, headers, body}) and returns {name, status, detail}, so the same
// logic runs against live responses and against tests/fixtures/deployed.

export const PASS = 'pass';
export const FAIL = 'fail';
// "unavailable" means the deployment does not offer the feature at all (SSO not
// configured, a curriculum day not shipped). It is not a pass, and it is kept
// apart from FAIL so an operator can tell "not set up yet" from "broken".
export const UNAVAILABLE = 'unavailable';

export const exitCodeFor = checks =>
  checks.some(c => c.status === FAIL) ? 1 : checks.some(c => c.status === UNAVAILABLE) ? 2 : 0;

export async function snapshot(response) {
  const headers = {};
  for (const name of ['content-type', 'location', 'set-cookie']) {
    const value = response.headers.get(name);
    if (value !== null) headers[name] = value;
  }
  return {status: response.status, headers, body: await response.text()};
}

const result = (name, status, detail) => ({name, status, detail});
const parseJson = body => { try { return JSON.parse(body); } catch { return undefined; } };
const SHA = /^[0-9a-f]{40}$/;

export function evaluateHealth(health) {
  const name = 'Academy and Proof ready';
  if (health.status !== 200) return result(name, FAIL, `/game/health HTTP ${health.status}`);
  const body = parseJson(health.body);
  if (body?.ok !== true) return result(name, FAIL, '/game/health ok is not true');
  if (body.proof !== true) return result(name, FAIL, '/game/health proof is not true (Proof sidecar unreachable)');
  return result(name, PASS, 'ok=true proof=true');
}

export function evaluateRevision(health, expectedRevision) {
  const name = 'Deployed revision matches EXPECTED_REVISION';
  const revision = parseJson(health.body)?.revision;
  if (revision === null || revision === undefined || revision === '')
    return result(name, FAIL, `/game/health reports no revision (${JSON.stringify(revision ?? null)}); set SOURCE_REVISION on the deployed process`);
  if (!SHA.test(revision)) return result(name, FAIL, `/game/health revision is not a full SHA: ${JSON.stringify(revision)}`);
  if (revision !== expectedRevision) return result(name, FAIL, `revision mismatch: deployed ${revision}, expected ${expectedRevision}`);
  return result(name, PASS, revision);
}

export function observedRevision(health) {
  const revision = parseJson(health.body)?.revision;
  return SHA.test(revision || '') ? revision : null;
}

export function evaluateConfig(config) {
  const name = 'Public runtime config';
  if (config.status !== 200) return result(name, FAIL, `/game/config HTTP ${config.status}`);
  const body = parseJson(config.body);
  const flags = ['googleSso', 'portal', 'portalLaunch'];
  const wrong = flags.filter(flag => typeof body?.[flag] !== 'boolean');
  if (wrong.length) return result(name, FAIL, `/game/config missing boolean ${wrong.join(', ')}`);
  return result(name, PASS, flags.map(flag => `${flag}=${body[flag]}`).join(' '));
}

const GOOGLE_CLIENT_ID = /^[0-9]+-[0-9a-z]+\.apps\.googleusercontent\.com$/;

// /auth/google/start answers every outcome with a 302. The app reports its own
// failures as a redirect to /?login_error=<code> (server/app.mjs loginError), so
// the Location header alone separates configured, not configured and broken.
export function evaluateSsoStart(config, start, {publicUrl, expectedClientId} = {}) {
  const name = 'Facilitator Google login start';
  const enabled = parseJson(config.body)?.googleSso === true;
  if (start.status !== 302) return result(name, FAIL, `broken: /auth/google/start HTTP ${start.status}, expected 302`);
  const location = start.headers.location || '';
  const loginError = location.startsWith('/') ? new URL(location, 'http://academy.invalid').searchParams.get('login_error') : null;
  if (loginError === 'disabled' && !enabled)
    return result(name, UNAVAILABLE, 'not configured: /game/config googleSso=false and /auth/google/start redirects to /?login_error=disabled');
  if (loginError === 'disabled')
    return result(name, FAIL, 'broken: /game/config googleSso=true but /auth/google/start reports login_error=disabled');
  if (loginError) return result(name, FAIL, `broken: /auth/google/start redirects to /?login_error=${loginError}`);
  let target;
  try { target = new URL(location); } catch { return result(name, FAIL, `broken: unparseable Location ${JSON.stringify(location)}`); }
  if (target.protocol !== 'https:' || target.hostname !== 'accounts.google.com')
    return result(name, FAIL, `broken: /auth/google/start redirects to ${target.origin}, expected https://accounts.google.com`);
  if (!enabled) return result(name, FAIL, 'broken: /game/config googleSso=false but /auth/google/start redirects to Google');
  const q = target.searchParams, problems = [];
  const clientId = q.get('client_id') || '';
  if (expectedClientId ? clientId !== expectedClientId : !GOOGLE_CLIENT_ID.test(clientId))
    problems.push(`client_id ${JSON.stringify(clientId)} ${expectedClientId ? 'differs from EXPECTED_GOOGLE_CLIENT_ID' : 'is not a Google OAuth client id'}`);
  const callback = new URL('/auth/google/callback', publicUrl).href;
  if (q.get('redirect_uri') !== callback) problems.push(`redirect_uri ${JSON.stringify(q.get('redirect_uri'))}, expected ${callback}`);
  if (q.get('response_type') !== 'code') problems.push('response_type is not code');
  const scopes = (q.get('scope') || '').split(' ');
  if (!scopes.includes('openid') || !scopes.includes('email')) problems.push('scope lacks openid email');
  if (q.get('code_challenge_method') !== 'S256') problems.push('code_challenge_method is not S256');
  for (const param of ['state', 'nonce', 'code_challenge']) if (!q.get(param)) problems.push(`${param} missing`);
  if (!/(^|,\s*)academy-login=[^;,\s]+/.test(start.headers['set-cookie'] || '')) problems.push('academy-login state cookie not set');
  if (problems.length) return result(name, FAIL, `broken: ${problems.join('; ')}`);
  return result(name, PASS, `redirects to accounts.google.com client_id=${clientId} redirect_uri=${callback}`);
}
