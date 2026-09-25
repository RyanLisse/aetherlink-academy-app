import {Effect, Layer} from 'effect';
import {afterAll, afterEach, beforeAll, describe, expect, test, vi} from 'vitest';
import {FacilitatorAuth, FacilitatorAuthMemory, type FacilitatorAuthShape} from '../../src/identity/facilitator-auth.ts';
import {googleSsoFromEnv, type GoogleSso} from '../../src/identity/google-sso.ts';
import {TokenService, TokenServiceLive} from '../../src/identity/tokens.ts';
import {SquadStore, SquadStoreMemory} from '../../src/squad/store.ts';
import {CLIENT_ID, startFakeOidc, type FakeOidc} from './fake-oidc.ts';
import {beginLogin, PUBLIC_URL, setCookies, ssoFor, startInstance} from './login-harness.ts';

const memoryAuth = (sso: GoogleSso): Promise<FacilitatorAuthShape> =>
  Effect.runPromise(Effect.gen(function* () {
    return yield* FacilitatorAuth;
  }).pipe(Effect.provide(FacilitatorAuthMemory(sso))));

describe('Google SSO login routes (fake OIDC provider, in-memory sessions)', () => {
  let oidc: FakeOidc;
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    oidc = await startFakeOidc();
  });
  afterAll(async () => {
    await oidc.close();
  });
  afterEach(async () => {
    vi.useRealTimers();
    while (cleanup.length) await cleanup.pop()!();
  });

  const instance = async (allowedDomains?: string) => startInstance(await memoryAuth(ssoFor(oidc, allowedDomains)), cleanup);

  test('happy path: PKCE start, callback sets a 12h HttpOnly Secure Lax session cookie that /authoring-api accepts', async () => {
    const app = await instance();
    const browser = app.browser();
    const {started, authorizeUrl, callbackPath} = await beginLogin(browser, oidc);

    expect(started.status).toBe(302);
    const authorize = new URL(authorizeUrl);
    expect(authorize.origin + authorize.pathname).toBe(`${oidc.issuer}/authorize`);
    expect(authorize.searchParams.get('client_id')).toBe(CLIENT_ID);
    expect(authorize.searchParams.get('redirect_uri')).toBe('https://academy.example.test/auth/google/callback');
    expect(authorize.searchParams.get('response_type')).toBe('code');
    expect(authorize.searchParams.get('scope')).toBe('openid email profile');
    expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authorize.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(authorize.searchParams.get('hd')).toBe('facilitators.example');
    const loginCookie = setCookies(started).get('academy-login')!;
    expect(loginCookie.attributes).toEqual(expect.arrayContaining(['httponly', 'secure', 'samesite=lax', 'path=/', 'max-age=600']));

    expect((await browser.get('/authoring-api/lessons')).status).toBe(401);

    const done = await browser.get(callbackPath);
    expect(done.status).toBe(302);
    expect(done.headers.get('location')).toBe('/?facilitator=1');
    const session = setCookies(done).get('academy-facilitator')!;
    expect(session.value).toMatch(/^[0-9a-f]{64}$/);
    expect(session.attributes).toEqual(expect.arrayContaining(['httponly', 'secure', 'samesite=lax', 'path=/', 'max-age=43200']));
    expect(browser.cookies.has('academy-login')).toBe(false);

    const token = oidc.tokenRequests.at(-1)!;
    expect(token.get('redirect_uri')).toBe('https://academy.example.test/auth/google/callback');
    expect(token.get('code_verifier')).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const lessons = await browser.get('/authoring-api/lessons');
    expect(lessons.status).toBe(200);
    expect(await lessons.json()).toEqual({lessons: []});
    const created = await browser.send('/authoring-api/lessons', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({title: 'Synthetic SSO lesson', objective: 'Synthetic objective', outline: ['Part one']}),
    });
    expect(created.status).toBe(201);
  });

  test('a Google account outside ACADEMY_FACILITATOR_DOMAINS gets login_error=domain and no session', async () => {
    const app = await instance();
    const browser = app.browser();
    const {callbackPath} = await beginLogin(browser, oidc, {email: 'someone@gmail.com', hd: undefined});
    const response = await browser.get(callbackPath);
    expect(response.headers.get('location')).toBe('/?login_error=domain');
    expect(setCookies(response).has('academy-facilitator')).toBe(false);
    expect([...browser.cookies.keys()]).toEqual([]);
  });

  test('a hosted domain outside the allowlist is refused even with an allowlisted-looking email', async () => {
    const app = await instance();
    const browser = app.browser();
    const {callbackPath} = await beginLogin(browser, oidc, {hd: 'other-workspace.example'});
    expect((await browser.get(callbackPath)).headers.get('location')).toBe('/?login_error=domain');
  });

  test('state mismatch, missing state and replayed callbacks answer login_error=state', async () => {
    const app = await instance();
    const browser = app.browser();
    const {callbackPath} = await beginLogin(browser, oidc);
    const tampered = callbackPath.replace(/state=[^&]+/, 'state=forged-state');
    expect((await browser.get(tampered)).headers.get('location')).toBe('/?login_error=state');

    const second = app.browser();
    const {callbackPath: noState} = await beginLogin(second, oidc);
    expect((await second.get(noState.replace(/&?state=[^&]+/, ''))).headers.get('location')).toBe('/?login_error=state');

    const third = app.browser();
    const {callbackPath: once} = await beginLogin(third, oidc);
    const replayer = app.browser(new Map());
    expect((await third.get(once)).headers.get('location')).toBe('/?facilitator=1');
    expect((await replayer.get(once)).headers.get('location')).toBe('/?login_error=state');
  });

  test('a callback in another browser without the login cookie completes once from server-side state (gateway parity)', async () => {
    const app = await instance();
    const starter = app.browser();
    const {callbackPath} = await beginLogin(starter, oidc);
    const other = app.browser();
    expect((await other.get(callbackPath)).headers.get('location')).toBe('/?facilitator=1');
    expect(other.cookies.get('academy-facilitator')).toMatch(/^[0-9a-f]{64}$/);
  });

  test('a login older than 10 minutes answers login_error=state', async () => {
    const app = await instance();
    const browser = app.browser();
    const {callbackPath} = await beginLogin(browser, oidc);
    vi.useFakeTimers({now: Date.now() + 11 * 60 * 1000, toFake: ['Date']});
    expect((await browser.get(callbackPath)).headers.get('location')).toBe('/?login_error=state');
  });

  test('wrong nonce, expired ID token and wrong audience answer login_error=verify', async () => {
    const now = Math.floor(Date.now() / 1000);
    for (const claims of [{nonce: 'attacker-nonce'}, {iat: now - 3600, exp: now - 600}, {aud: 'other-client'}, {email_verified: false}]) {
      const app = await instance();
      const browser = app.browser();
      const {callbackPath} = await beginLogin(browser, oidc, claims);
      const response = await browser.get(callbackPath);
      expect(response.headers.get('location')).toBe('/?login_error=verify');
      expect(browser.cookies.has('academy-facilitator')).toBe(false);
    }
  });

  test('a code minted for another PKCE challenge fails the token exchange with login_error=token', async () => {
    const app = await instance();
    const victim = app.browser();
    await beginLogin(victim, oidc);
    const attacker = app.browser();
    const {callbackPath: attackerCallback} = await beginLogin(attacker, oidc);
    const {callbackPath: victimCallback} = await beginLogin(victim, oidc);
    const victimState = new URL(victimCallback, PUBLIC_URL).searchParams.get('state')!;
    const attackerCode = new URL(attackerCallback, PUBLIC_URL).searchParams.get('code')!;
    const response = await victim.get(`/auth/google/callback?code=${attackerCode}&state=${victimState}`);
    expect(response.headers.get('location')).toBe('/?login_error=token');
  });

  test('participants cannot obtain or forge a facilitator session', async () => {
    const participant = await Effect.runPromise(Effect.gen(function* () {
      const squad = yield* SquadStore;
      const tokens = yield* TokenService;
      const room = yield* squad.create('Synthetic test squad', {slug: 'synthetic-test'});
      const joined = yield* squad.join(room.code, 'Synthetic participant');
      const session = yield* tokens.authenticate(joined.token, 'browser');
      return {browser: joined.token, mcp: yield* tokens.mint(room.roomId, session.personId, 'mcp')};
    }).pipe(Effect.provide(TokenServiceLive.pipe(Layer.provideMerge(SquadStoreMemory())))));
    const app = await instance();
    for (const token of [participant.browser, participant.mcp, 'f'.repeat(64)]) {
      const withCookie = app.browser(new Map([['academy-facilitator', token]]));
      expect((await withCookie.get('/authoring-api/lessons')).status).toBe(401);
      expect((await app.handler(new Request(`${PUBLIC_URL}/authoring-api/lessons`, {headers: {authorization: `Bearer ${token}`}}))).status).toBe(401);
    }
    const learner = app.browser();
    const {callbackPath} = await beginLogin(learner, oidc, {email: 'learner@participants.example', hd: 'participants.example'});
    expect((await learner.get(callbackPath)).headers.get('location')).toBe('/?login_error=domain');
    expect((await learner.get('/authoring-api/lessons')).status).toBe(401);
  });

  test('logout deletes the session and expires the cookie', async () => {
    const app = await instance();
    const browser = app.browser();
    const {callbackPath} = await beginLogin(browser, oidc);
    await browser.get(callbackPath);
    const token = browser.cookies.get('academy-facilitator')!;
    const out = await browser.send('/auth/logout', {method: 'POST'});
    expect(out.status).toBe(204);
    expect(setCookies(out).get('academy-facilitator')!.attributes).toEqual(expect.arrayContaining(['max-age=0']));
    const stale = app.browser(new Map([['academy-facilitator', token]]));
    expect((await stale.get('/authoring-api/lessons')).status).toBe(401);
  });

  test('disabled without Google env: start and callback redirect to login_error=disabled', async () => {
    const app = await startInstance(await memoryAuth(googleSsoFromEnv({})), cleanup);
    const browser = app.browser();
    const started = await browser.get('/auth/google/start');
    expect(started.status).toBe(302);
    expect(started.headers.get('location')).toBe('/?login_error=disabled');
    expect(setCookies(started).get('academy-login')!.attributes).toContain('max-age=0');
    expect((await browser.get('/auth/google/callback?code=x&state=y')).headers.get('location')).toBe('/?login_error=disabled');
  });

  test('partial Google env fails at boot, same all-or-nothing rule as the gateway', () => {
    expect(googleSsoFromEnv({}).enabled).toBe(false);
    expect(() => googleSsoFromEnv({GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret'})).toThrow(
      'Google-login vereist dat GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en ACADEMY_FACILITATOR_DOMAINS alle drie zijn ingesteld.',
    );
    const sso = googleSsoFromEnv({GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', ACADEMY_FACILITATOR_DOMAINS: 'a.example', ACADEMY_PUBLIC_URL: 'https://academy.aetherlink.ai'});
    expect(sso.enabled).toBe(true);
    expect(sso.redirectUri).toBe('https://academy.aetherlink.ai/auth/google/callback');
  });
});
