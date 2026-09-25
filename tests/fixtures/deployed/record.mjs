// Re-records the deployed-smoke fixtures with anonymous GETs only.
// Usage: node tests/fixtures/deployed/record.mjs [origin]   (default: the Hetzner box)
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createGoogleSso} from '../../../server/google-sso.mjs';
import {moduleScripts} from '../../../scripts/deployed-curriculum.mjs';
import {snapshot} from '../../../scripts/deployed-smoke-checks.mjs';

const origin = new URL(process.argv[2] || 'http://91.99.78.17:4317').origin;
const dir = new URL('./', import.meta.url);
const ROUTE_LITERAL = /.{0,40}"\/(?:classroom|workshop|lesson)\/[a-z0-9-]+".{0,40}/g;

async function get(path) {
  const url = new URL(path, origin).href, retrievedAt = new Date().toISOString();
  const response = await snapshot(await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(30_000)}));
  return {url, retrievedAt, response};
}
function save(file, {url, retrievedAt, response}, trim) {
  const full = response.body;
  const body = trim ? (full.match(trim.pattern) || []).join('\n') : full;
  const provenance = {url, retrievedAt, bytes: Buffer.byteLength(full), sha256: createHash('sha256').update(full).digest('hex'), ...(trim ? {trim: trim.describe} : {})};
  writeFileSync(new URL(file, dir), JSON.stringify({provenance, response: {...response, body}}, null, 2) + '\n');
  console.log(`${file} ${response.status} ${provenance.bytes}B -> ${Buffer.byteLength(body)}B`);
}

save('health.json', await get('/game/health'));
save('config.json', await get('/game/config'));
save('sso-start-disabled.json', await get('/auth/google/start'));
const shell = await get('/classroom/1');
save('web-shell.json', shell);
const [bundlePath] = moduleScripts(shell.response.body);
save('web-bundle-excerpt.json', await get(bundlePath), {pattern: ROUTE_LITERAL, describe: `every match of ${ROUTE_LITERAL}, joined by newlines`});

const publicUrl = 'https://academy.example.test';
const sso = createGoogleSso({clientId: '000000000000-placeholder.apps.googleusercontent.com', clientSecret: 'placeholder', allowedDomains: 'example.test', publicUrl});
const retrievedAt = new Date().toISOString();
const location = await sso.startUrl({state: 'placeholder-state', nonce: 'placeholder-nonce', codeChallenge: 'placeholder-challenge'});
save('sso-start-configured.json', {
  url: `server/google-sso.mjs startUrl() with placeholder client for ${publicUrl}, authorization_endpoint from live https://accounts.google.com/.well-known/openid-configuration`,
  retrievedAt,
  response: {status: 302, headers: {location, 'set-cookie': 'academy-login=placeholder.signature; Max-Age=600; Path=/; HttpOnly; SameSite=Lax'}, body: ''},
});
