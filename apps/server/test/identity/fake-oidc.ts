import {createHash, generateKeyPairSync, randomBytes, sign} from 'node:crypto';
import {createServer, type Server} from 'node:http';
import type {AddressInfo} from 'node:net';

export const CLIENT_ID = 'synthetic-client.apps.googleusercontent.test';
export const CLIENT_SECRET = 'synthetic-client-secret';

interface PendingCode {
  readonly claims: Record<string, unknown>;
  readonly codeChallenge: string;
  readonly redirectUri: string;
}

export interface FakeOidc {
  readonly issuer: string;
  readonly tokenRequests: Array<URLSearchParams>;
  /** Plays the Google consent screen: mints a code for the authorize URL and returns the callback path+query the browser would follow. */
  readonly consent: (authorizeUrl: string, claims?: Record<string, unknown>) => string;
  readonly close: () => Promise<void>;
}

/**
 * Loopback stand-in for Google: discovery, JWKS and a token endpoint that
 * enforces client credentials, redirect_uri and the PKCE S256 verifier. ID
 * tokens are RS256-signed with a key generated per run. Never calls Google.
 */
export const startFakeOidc = async (): Promise<FakeOidc> => {
  const {publicKey, privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
  const jwk = {...publicKey.export({format: 'jwk'}), kid: 'synthetic-key', alg: 'RS256', use: 'sig'};
  const codes = new Map<string, PendingCode>();
  const tokenRequests: Array<URLSearchParams> = [];
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const idToken = (claims: Record<string, unknown>) => {
    const input = `${encode({alg: 'RS256', kid: jwk.kid, typ: 'JWT'})}.${encode(claims)}`;
    return `${input}.${sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url')}`;
  };
  let issuer = '';

  const server: Server = createServer((request, response) => {
    const send = (status: number, body: unknown) => {
      response.writeHead(status, {'content-type': 'application/json'});
      response.end(JSON.stringify(body));
    };
    const url = new URL(request.url ?? '/', issuer);
    if (request.method === 'GET' && url.pathname === '/.well-known/openid-configuration') {
      return send(200, {issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks`});
    }
    if (request.method === 'GET' && url.pathname === '/jwks') return send(200, {keys: [jwk]});
    if (request.method === 'POST' && url.pathname === '/token') {
      let body = '';
      request.on('data', (chunk) => (body += chunk));
      request.on('end', () => {
        const form = new URLSearchParams(body);
        tokenRequests.push(form);
        const pending = codes.get(form.get('code') ?? '');
        codes.delete(form.get('code') ?? '');
        const challenge = createHash('sha256').update(form.get('code_verifier') ?? '').digest('base64url');
        const valid =
          pending &&
          form.get('grant_type') === 'authorization_code' &&
          form.get('client_id') === CLIENT_ID &&
          form.get('client_secret') === CLIENT_SECRET &&
          form.get('redirect_uri') === pending.redirectUri &&
          challenge === pending.codeChallenge;
        if (!valid) return send(400, {error: 'invalid_grant'});
        send(200, {access_token: 'synthetic-access', token_type: 'Bearer', id_token: idToken(pending.claims)});
      });
      return;
    }
    send(404, {error: 'not_found'});
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const consent = (authorizeUrl: string, overrides: Record<string, unknown> = {}) => {
    const url = new URL(authorizeUrl);
    const now = Math.floor(Date.now() / 1000);
    const code = randomBytes(16).toString('hex');
    const redirectUri = url.searchParams.get('redirect_uri')!;
    codes.set(code, {
      codeChallenge: url.searchParams.get('code_challenge')!,
      redirectUri,
      claims: {
        iss: issuer,
        aud: CLIENT_ID,
        sub: 'synthetic-google-subject',
        email: 'ada@facilitators.example',
        email_verified: true,
        name: 'Ada Facilitator',
        hd: 'facilitators.example',
        nonce: url.searchParams.get('nonce'),
        iat: now,
        exp: now + 600,
        ...overrides,
      },
    });
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', url.searchParams.get('state')!);
    return `${callback.pathname}${callback.search}`;
  };

  return {issuer, tokenRequests, consent, close: () => new Promise((resolve) => server.close(() => resolve()))};
};
