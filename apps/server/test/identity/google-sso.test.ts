import {createHmac, generateKeyPairSync, sign} from 'node:crypto';
import {describe, expect, test} from 'vitest';
import {createGoogleSso, readLoginState, signLoginState} from '../../src/identity/google-sso.ts';

const now = () => Math.floor(Date.now() / 1000);

function fixture(allowedDomain = 'allowed.example', {clientId = 'client-id'}: {clientId?: string} = {}) {
  const {publicKey, privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
  const jwk = {...publicKey.export({format: 'jwk'}), kid: 'test-key', alg: 'RS256', use: 'sig'};
  let token: string | undefined;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const issue = (claims: Record<string, unknown>, headerOverrides: Record<string, unknown> = {}) => {
    const header = encode({alg: 'RS256', kid: jwk.kid, typ: 'JWT', ...headerOverrides});
    const payload = encode(claims);
    const input = `${header}.${payload}`;
    const signature =
      headerOverrides.alg === 'none'
        ? ''
        : headerOverrides.alg === 'HS256'
          ? createHmac('sha256', 'client-secret').update(input).digest('base64url')
          : sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
    return `${input}.${signature}`;
  };
  const fetchImpl: typeof fetch = async (url, options = {}) => {
    if (String(url) === 'https://accounts.google.com/.well-known/openid-configuration') {
      return Response.json({
        issuer: 'https://accounts.google.com',
        authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_endpoint: 'https://oauth2.googleapis.com/token',
        jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
      });
    }
    if (String(url) === 'https://www.googleapis.com/oauth2/v3/certs') return Response.json({keys: [jwk]});
    if (String(url) === 'https://oauth2.googleapis.com/token') {
      expect(options.method).toBe('POST');
      return Response.json({id_token: token});
    }
    throw new Error(`Unexpected URL ${url}`);
  };
  const sso = createGoogleSso({
    clientId,
    clientSecret: 'client-secret',
    allowedDomains: allowedDomain,
    publicUrl: 'https://academy.example.test',
    fetchImpl,
  });
  const claims = (overrides: Record<string, unknown> = {}) => ({
    iss: 'https://accounts.google.com',
    aud: clientId.trim(),
    sub: 'google-subject',
    email: 'facilitator@allowed.example',
    email_verified: true,
    name: 'Ada Facilitator',
    hd: 'allowed.example',
    nonce: 'expected-nonce',
    iat: now(),
    exp: now() + 600,
    ...overrides,
  });
  return {sso, issue, claims, setToken: (value: string) => { token = value; }, clientId: clientId.trim()};
}

describe('Google SSO (ported)', () => {
  test('authorization-code exchange verifies a valid Google id_token', async () => {
    const f = fixture();
    f.setToken(f.issue(f.claims()));
    await expect(
      f.sso.exchangeAndVerify({code: 'code', codeVerifier: 'verifier', nonce: 'expected-nonce'}),
    ).resolves.toMatchObject({
      sub: 'google-subject',
      email: 'facilitator@allowed.example',
      name: 'Ada Facilitator',
      domain: 'allowed.example',
    });
  });

  test('rejects wrong aud, expired, wrong nonce, unverified email, disallowed hd', async () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ['wrong aud', {aud: 'other-client'}],
      ['expired', {exp: now() - 301}],
      ['wrong nonce', {nonce: 'other-nonce'}],
      ['unverified email', {email_verified: false}],
      ['disallowed hd', {hd: 'blocked.example'}],
    ];
    for (const [, overrides] of cases) {
      const f = fixture();
      await expect(f.sso.verifyIdToken(f.issue(f.claims(overrides)), {nonce: 'expected-nonce'})).rejects.toBeTruthy();
    }
  });

  test('rejects alg none / HS256 / missing kid', async () => {
    for (const header of [{alg: 'none'}, {alg: 'HS256'}, {kid: undefined}]) {
      const f = fixture();
      await expect(f.sso.verifyIdToken(f.issue(f.claims(), header), {nonce: 'expected-nonce'})).rejects.toBeTruthy();
    }
  });

  test('callback rejects state mismatch and expired login state', async () => {
    const f = fixture();
    await expect(
      f.sso.handleCallback({code: 'code', state: 'wrong'}, {
        state: 'right', nonce: 'expected-nonce', codeVerifier: 'verifier', expiresAt: Date.now() + 1000,
      }),
    ).rejects.toBeTruthy();
    await expect(
      f.sso.handleCallback({code: 'code', state: 'right'}, {
        state: 'right', nonce: 'expected-nonce', codeVerifier: 'verifier', expiresAt: Date.now() - 1,
      }),
    ).rejects.toBeTruthy();
  });

  test('login-state cookies are signed and reject tampering', () => {
    const value = signLoginState({state: 'state'}, 'secret');
    expect(readLoginState(value, 'secret')).toEqual({state: 'state'});
    expect(() => readLoginState(value + 'x', 'secret')).toThrow();
  });

  test('disabled when env secrets missing (AET-6 dependency)', () => {
    const sso = createGoogleSso({clientId:'', clientSecret:'', allowedDomains:'', publicUrl: 'https://academy.example.test'});
    expect(sso.enabled).toBe(false);
  });
});
