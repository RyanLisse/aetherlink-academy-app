import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const LOGIN_ERRORS = {
  disabled: 'Google SSO is off: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ACADEMY_FACILITATOR_DOMAINS are not all set on this server',
  state: 'login state missing, forged, expired or replayed (cookie lost, or the callback came back to a different origin)',
  domain: 'the Google account domain is not in ACADEMY_FACILITATOR_DOMAINS',
  token: 'the code exchange with Google failed (wrong client secret, redirect URI mismatch, or a reused code)',
  verify: 'ID token check failed (aud = wrong client ID, nonce, expiry, or unverified email); the server log has the reason',
  session: 'Google login worked but the session could not be stored (Postgres down, or migration 0006 missing on apps/server)',
};

export const check = (name, ok, detail) => ({name, ok: Boolean(ok), detail});

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) positional.push(arg);
    else if (arg.includes('=')) flags[arg.slice(2, arg.indexOf('='))] = arg.slice(arg.indexOf('=') + 1);
    else flags[arg.slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return {positional, flags};
}

export function baseOrigin(raw) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`base URL must be http(s), got ${raw}`);
  return url.origin;
}

export async function request(url, {timeoutMs = 10_000} = {}) {
  const response = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(timeoutMs)});
  const body = await response.text();
  return {status: response.status, location: response.headers.get('location'), setCookie: response.headers.getSetCookie(), body};
}

export async function fetchJson(url) {
  const response = await request(url);
  let json = null;
  try {
    json = JSON.parse(response.body);
  } catch {}
  return {...response, json};
}

export function describeError(error) {
  const cause = error?.cause;
  const causeText = cause ? ` (${cause.code ?? cause.errors?.[0]?.code ?? cause.name ?? 'error'}${cause.message ? `: ${cause.message}` : ''})` : '';
  return `${typeof error?.code === 'string' ? `${error.code}: ` : ''}${error?.message ?? String(error)}${causeText}`;
}

/** Checks a `/auth/google/start` response without following it to Google. */
export function inspectGoogleStart(response, {expectedRedirectUri}) {
  const checks = [];
  if (![302, 303, 307].includes(response.status) || !response.location) {
    return [check('start redirects', false, `expected a redirect, got HTTP ${response.status}`)];
  }
  const location = new URL(response.location, expectedRedirectUri);
  const loginError = location.searchParams.get('login_error');
  if (loginError) {
    return [check('start redirects to Google', false, `redirected to /?login_error=${loginError}: ${LOGIN_ERRORS[loginError] ?? 'unknown code'}`)];
  }
  const params = location.searchParams;
  checks.push(check('start redirects to Google', location.origin === 'https://accounts.google.com', `${location.origin}${location.pathname}`));
  checks.push(check('redirect_uri matches', params.get('redirect_uri') === expectedRedirectUri, `sent ${params.get('redirect_uri')}, expected ${expectedRedirectUri}`));
  checks.push(check('client_id present', /\.apps\.googleusercontent\.com$/.test(params.get('client_id') ?? ''), params.get('client_id') ? 'ends in .apps.googleusercontent.com' : 'missing'));
  checks.push(check('response_type=code', params.get('response_type') === 'code', params.get('response_type') ?? 'missing'));
  const scopes = new Set((params.get('scope') ?? '').split(' '));
  checks.push(check('scope openid email profile', ['openid', 'email', 'profile'].every((scope) => scopes.has(scope)), params.get('scope') ?? 'missing'));
  checks.push(
    check(
      'PKCE S256',
      params.get('code_challenge_method') === 'S256' && /^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') ?? ''),
      `method ${params.get('code_challenge_method') ?? 'missing'}, challenge ${params.get('code_challenge') ? 'present' : 'missing'}`,
    ),
  );
  checks.push(check('state and nonce present', (params.get('state') ?? '').length >= 32 && (params.get('nonce') ?? '').length >= 32, 'random values of 32+ characters'));
  const cookie = response.setCookie.find((value) => value.startsWith('academy-login='));
  const https = expectedRedirectUri.startsWith('https:');
  const cookieOk = Boolean(cookie) && /;\s*HttpOnly/i.test(cookie) && /;\s*SameSite=Lax/i.test(cookie) && /;\s*Secure/i.test(cookie) === https;
  checks.push(check('academy-login cookie', cookieOk, cookie ? `HttpOnly, SameSite=Lax${https ? ', Secure' : ''} expected` : 'not set'));
  if (params.get('hd')) checks.push(check('hd hint', true, params.get('hd')));
  return checks;
}

export async function googleStartChecks(base, publicUrl) {
  const expectedRedirectUri = new URL('/auth/google/callback', publicUrl ?? base).href;
  try {
    return inspectGoogleStart(await request(`${base}/auth/google/start`), {expectedRedirectUri});
  } catch (error) {
    return [check('start redirects to Google', false, describeError(error))];
  }
}

/** The ids apps/server's migrator records: drizzle file `NNNN_name.sql` becomes id NNNN+1 (see apps/server/src/db/migrate.ts). */
export function expectedMigrations(directory = fileURLToPath(new URL('../../apps/server/drizzle/', import.meta.url))) {
  return readdirSync(directory)
    .map((entry) => /^(\d+)_(.+)\.sql$/.exec(entry))
    .filter(Boolean)
    .map(([, id, name]) => ({id: Number(id) + 1, name}))
    .sort((a, b) => a.id - b.id);
}

export function migrationCheck(rows, expected = expectedMigrations()) {
  const applied = new Map(rows.map((row) => [Number(row.migration_id), row.name]));
  const missing = expected.filter(({id, name}) => applied.get(id) !== name);
  return check(
    'drizzle migrations applied',
    missing.length === 0,
    missing.length === 0 ? `${expected.length} of ${expected.length}, latest ${expected.at(-1).id}_${expected.at(-1).name}` : `missing ${missing.map(({id, name}) => `${id}_${name}`).join(', ')}`,
  );
}

export function report(title, checks, log = console.log) {
  log(title);
  for (const {name, ok, detail} of checks) log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  const failed = checks.filter((item) => !item.ok).length;
  log(failed ? `${failed} of ${checks.length} checks failed` : `all ${checks.length} checks passed`);
  return failed ? 1 : 0;
}

export const isMain = (meta) => process.argv[1] && fileURLToPath(meta.url) === process.argv[1];
