import assert from 'node:assert/strict';
import {execFileSync, spawn} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import {tmpdir} from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import {after, before, describe, test} from 'node:test';
import {verifyAppsServer} from '../scripts/verify/apps-server.mjs';
import {verifyGoogleOauth} from '../scripts/verify/google-oauth.mjs';
import {expectedMigrations, migrationCheck} from '../scripts/verify/lib.mjs';
import {smtpHandshake, smtpSettings, verifySmtp} from '../scripts/verify/smtp.mjs';

const listen = (server, host = '127.0.0.1') => new Promise((resolve) => server.listen(0, host, () => resolve(server.address().port)));
const close = (server) => new Promise((resolve) => server.close(() => resolve()));
const token = (char) => char.repeat(43);

function fakeGateway() {
  const state = {googleSso: true, emailLogin: true, redirectBase: null, health: {ok: true, proof: true, revision: 'abc123'}};
  const server = http.createServer((req, res) => {
    const json = (status, body) => res.writeHead(status, {'content-type': 'application/json'}).end(JSON.stringify(body));
    if (req.url === '/game/config') return json(200, {googleSso: state.googleSso, emailLogin: state.emailLogin});
    if (req.url === '/health') return json(state.health.ok ? 200 : 503, state.health);
    if (req.url === '/connection') {
      const probe = {reachable: true, latencyMs: 3, checkedAt: '2026-09-26T00:00:00Z', error: null};
      return json(200, {postgres: probe, redis: {...probe, reachable: false, error: 'ECONNREFUSED'}, proof: probe});
    }
    if (req.url === '/auth/google/start') {
      if (!state.googleSso) return res.writeHead(302, {location: '/?login_error=disabled'}).end();
      const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      google.search = new URLSearchParams({
        client_id: '1234-abc.apps.googleusercontent.com',
        redirect_uri: `${state.redirectBase}/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        state: token('s'),
        nonce: token('n'),
        code_challenge: token('c'),
        code_challenge_method: 'S256',
        hd: 'aetherlink.ai',
      }).toString();
      return res.writeHead(302, {location: google.href, 'set-cookie': 'academy-login=signed; Max-Age=600; Path=/; HttpOnly; SameSite=Lax'}).end();
    }
    res.writeHead(404).end();
  });
  return {server, state};
}

describe('google-oauth and apps-server verifiers', () => {
  const {server, state} = fakeGateway();
  let base;
  before(async () => {
    base = `http://127.0.0.1:${await listen(server)}`;
    state.redirectBase = base;
  });
  after(() => close(server));

  test('a correctly configured gateway passes every check', async () => {
    state.googleSso = true;
    const checks = await verifyGoogleOauth(base);
    assert.deepEqual(
      checks.map(({name, ok}) => [name, ok]),
      [
        ['/game/config googleSso', true],
        ['start redirects to Google', true],
        ['redirect_uri matches', true],
        ['client_id present', true],
        ['response_type=code', true],
        ['scope openid email profile', true],
        ['PKCE S256', true],
        ['state and nonce present', true],
        ['academy-login cookie', true],
        ['hd hint', true],
      ],
    );
    assert.equal(checks.at(-1).detail, 'aetherlink.ai');
  });

  test('SSO off reports the disabled login_error and what it means', async () => {
    state.googleSso = false;
    const checks = await verifyGoogleOauth(base);
    assert.deepEqual(checks, [
      {name: '/game/config googleSso', ok: false, detail: 'googleSso=false (HTTP 200)'},
      {
        name: 'start redirects to Google',
        ok: false,
        detail: 'redirected to /?login_error=disabled: Google SSO is off: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ACADEMY_FACILITATOR_DOMAINS are not all set on this server',
      },
    ]);
  });

  test('a public URL that differs from the registered callback fails redirect_uri and the Secure cookie check', async () => {
    state.googleSso = true;
    const checks = await verifyGoogleOauth(base, {publicUrl: 'https://academy.aetherlink.ai'});
    const byName = Object.fromEntries(checks.map((item) => [item.name, item]));
    assert.deepEqual(byName['redirect_uri matches'], {
      name: 'redirect_uri matches',
      ok: false,
      detail: `sent ${base}/auth/google/callback, expected https://academy.aetherlink.ai/auth/google/callback`,
    });
    assert.equal(byName['academy-login cookie'].ok, false);
  });

  test('apps-server checks health, revision and each dependency probe', async () => {
    state.googleSso = true;
    const checks = await verifyAppsServer(base, {revision: 'def456', skipGoogle: true});
    assert.deepEqual(checks, [
      {name: '/health ok and proof', ok: true, detail: 'HTTP 200, ok=true, proof=true'},
      {name: '/health revision', ok: false, detail: 'serving abc123, expected def456'},
      {name: '/connection postgres', ok: true, detail: 'reachable in 3 ms'},
      {name: '/connection redis', ok: false, detail: 'unreachable in 3 ms, ECONNREFUSED'},
      {name: '/connection proof', ok: true, detail: 'reachable in 3 ms'},
    ]);
  });

  test('an unreachable server fails instead of throwing', async () => {
    const checks = await verifyAppsServer('http://127.0.0.1:9', {skipGoogle: true});
    assert.equal(checks.length, 1);
    assert.equal(checks[0].name, '/health ok and proof');
    assert.equal(checks[0].ok, false);
  });
});

describe('migration expectations', () => {
  test('expected migrations mirror the drizzle files shifted by one', () => {
    assert.deepEqual(expectedMigrations().slice(0, 7), [
      {id: 1, name: 'dashing_pet_avengers'},
      {id: 2, name: 'immutability_triggers'},
      {id: 3, name: 'room_pin_invariants'},
      {id: 4, name: 'draft_content_hash'},
      {id: 5, name: 'search_tsvector'},
      {id: 6, name: 'authoring_authorship'},
      {id: 7, name: 'facilitator_sessions'},
    ]);
  });

  test('a database missing 0006 names the missing migration', () => {
    const expected = expectedMigrations().slice(0, 7);
    const rows = expected.map(({id, name}) => ({migration_id: id, name}));
    assert.deepEqual(migrationCheck(rows, expected), {name: 'drizzle migrations applied', ok: true, detail: '7 of 7, latest 7_facilitator_sessions'});
    assert.deepEqual(migrationCheck(rows.slice(0, 6), expected), {name: 'drizzle migrations applied', ok: false, detail: 'missing 7_facilitator_sessions'});
  });
});

function fakeSmtp({startTls = false, tlsContext, user = 'mailer', pass = 'pw-sentinel-9f3'} = {}) {
  const received = [];
  const server = net.createServer((raw) => {
    let socket = raw;
    let buffer = '';
    const reply = (text) => socket.write(`${text}\r\n`);
    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      let end;
      while ((end = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const [verb] = line.split(' ');
        received.push(verb.toUpperCase() === 'AUTH' ? 'AUTH' : line);
        if (verb === 'EHLO') reply(`250-fake.smtp\r\n${startTls && !(socket instanceof tls.TLSSocket) ? '250-STARTTLS\r\n' : ''}250 AUTH PLAIN LOGIN`);
        else if (verb === 'STARTTLS') {
          reply('220 ready');
          raw.off('data', onData);
          socket = new tls.TLSSocket(raw, {isServer: true, ...tlsContext});
          socket.on('data', onData);
        } else if (verb === 'AUTH') reply(line === `AUTH PLAIN ${Buffer.from(`\0${user}\0${pass}`).toString('base64')}` ? '235 ok' : '535 bad credentials');
        else if (verb === 'NOOP') reply('250 ok');
        else if (verb === 'QUIT') {
          reply('221 bye');
          socket.end();
        } else reply('502 not implemented');
      }
    };
    raw.on('data', onData);
    reply('220 fake.smtp ESMTP');
  });
  return {server, received};
}

describe('smtp verifier', () => {
  test('settings apply the same completeness rule as the app', () => {
    assert.deepEqual(smtpSettings({ACADEMY_MAIL_TRANSPORT: 'smtp', ACADEMY_SMTP_HOST: 'smtp.example', ACADEMY_SMTP_USER: 'u'}).problems, [
      'ACADEMY_SMTP_FROM is empty',
      'set both or neither of ACADEMY_SMTP_USER and ACADEMY_SMTP_PASS',
    ]);
    assert.equal(smtpSettings({ACADEMY_SMTP_PORT: '465'}).requireTls, false);
    assert.equal(smtpSettings({ACADEMY_SMTP_PORT: '587'}).requireTls, true);
  });

  test('without TLS required it authenticates and NOOPs but never sends mail', async () => {
    const {server, received} = fakeSmtp();
    const port = await listen(server);
    const result = await smtpHandshake({host: '127.0.0.1', port, user: 'mailer', pass: 'pw-sentinel-9f3', requireTls: false});
    await close(server);
    assert.deepEqual(result.sent, ['EHLO academy-verify', 'AUTH PLAIN [redacted]', 'NOOP', 'QUIT']);
    assert.deepEqual(received, ['EHLO academy-verify', 'AUTH', 'NOOP', 'QUIT']);
    assert.deepEqual(
      result.checks.map(({name, ok}) => [name, ok]),
      [
        ['SMTP greeting', true],
        ['EHLO', true],
        ['TLS', true],
        ['AUTH', true],
        ['NOOP', true],
      ],
    );
  });

  test('when TLS is required but not offered, credentials are never sent', async () => {
    const {server, received} = fakeSmtp();
    const port = await listen(server);
    const result = await smtpHandshake({host: '127.0.0.1', port, user: 'mailer', pass: 'pw-sentinel-9f3', requireTls: true});
    await close(server);
    assert.deepEqual(received, ['EHLO academy-verify', 'QUIT']);
    assert.deepEqual(result.checks.at(-1), {name: 'TLS', ok: false, detail: 'server does not offer STARTTLS; the app will refuse to send'});
  });

  test('STARTTLS upgrades, re-EHLOs and authenticates over TLS', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'verify-smtp-'));
    try {
      execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost', '-days', '1', '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem')], {stdio: 'ignore'});
      const cert = readFileSync(path.join(dir, 'cert.pem'));
      const {server, received} = fakeSmtp({startTls: true, tlsContext: {key: readFileSync(path.join(dir, 'key.pem')), cert}});
      const port = await listen(server, 'localhost');
      const result = await smtpHandshake({host: 'localhost', port, user: 'mailer', pass: 'pw-sentinel-9f3', requireTls: true, tlsOptions: {ca: cert}});
      await close(server);
      assert.deepEqual(received, ['EHLO academy-verify', 'STARTTLS', 'EHLO academy-verify', 'AUTH', 'NOOP', 'QUIT']);
      assert.deepEqual(
        result.checks.map(({name, ok}) => [name, ok]),
        [
          ['SMTP greeting', true],
          ['EHLO', true],
          ['TLS', true],
          ['AUTH', true],
          ['NOOP', true],
        ],
      );
      assert.match(result.checks[2].detail, /^STARTTLS, TLSv1\.[23], certificate valid$/);
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  test('the CLI prints results without the SMTP password', async () => {
    const {server} = fakeSmtp({pass: 'pw-sentinel-9f3'});
    const smtpPort = await listen(server);
    const {server: gateway} = fakeGateway();
    const httpPort = await listen(gateway);
    const env = {
      PATH: process.env.PATH,
      ACADEMY_MAIL_TRANSPORT: 'smtp',
      ACADEMY_SMTP_HOST: '127.0.0.1',
      ACADEMY_SMTP_PORT: String(smtpPort),
      ACADEMY_SMTP_FROM: 'Academy <academy@example.test>',
      ACADEMY_SMTP_USER: 'mailer',
      ACADEMY_SMTP_PASS: 'pw-sentinel-9f3',
      ACADEMY_SMTP_REQUIRE_TLS: '0',
    };
    const child = spawn(process.execPath, ['scripts/verify/smtp.mjs', `http://127.0.0.1:${httpPort}`], {env});
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const code = await new Promise((resolve) => child.on('close', resolve));
    await close(server);
    await close(gateway);
    assert.equal(code, 0, output);
    assert.doesNotMatch(output, /pw-sentinel-9f3/);
    assert.match(output, /PASS {2}\/game\/config emailLogin/);
    assert.match(output, /all 7 checks passed/);
  });

  test('verifySmtp without SMTP env only checks the config flag', async () => {
    const {server, state} = fakeGateway();
    state.emailLogin = false;
    const port = await listen(server);
    const checks = await verifySmtp(`http://127.0.0.1:${port}`, {});
    await close(server);
    assert.deepEqual(checks, [{name: '/game/config emailLogin', ok: false, detail: 'emailLogin=false (HTTP 200)'}]);
  });
});
