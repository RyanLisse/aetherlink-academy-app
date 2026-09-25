import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Layer} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {AuthoringLive} from '../../src/authoring/index.ts';
import {FacilitatorAuth, type FacilitatorAuthShape} from '../../src/identity/facilitator-auth.ts';
import {createGoogleSso} from '../../src/identity/google-sso.ts';
import {GoogleSsoRoutes} from '../../src/identity/google-routes.ts';
import {CLIENT_ID, CLIENT_SECRET, type FakeOidc} from './fake-oidc.ts';

export const PUBLIC_URL = 'https://academy.example.test';
export const ALLOWED_DOMAIN = 'facilitators.example';

export const ssoFor = (oidc: FakeOidc, allowedDomains = ALLOWED_DOMAIN) =>
  createGoogleSso({clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, allowedDomains, publicUrl: PUBLIC_URL, issuer: oidc.issuer});

/** A cookie jar plus fetch against one server instance: what a browser keeps between redirects. */
export interface Browser {
  readonly cookies: Map<string, string>;
  readonly get: (pathAndQuery: string) => Promise<Response>;
  readonly send: (pathAndQuery: string, init: RequestInit) => Promise<Response>;
}

export interface Instance {
  readonly handler: (request: Request) => Promise<Response>;
  readonly browser: (cookies?: Map<string, string>) => Browser;
}

/** Parses Set-Cookie into name -> {value, attributes}; attribute keys lower-cased. */
export const setCookies = (response: Response) =>
  new Map(
    response.headers.getSetCookie().map((line) => {
      const [pair, ...attributes] = line.split(';').map((part) => part.trim());
      const index = pair!.indexOf('=');
      return [
        pair!.slice(0, index),
        {value: decodeURIComponent(pair!.slice(index + 1)), attributes: attributes.map((attribute) => attribute.toLowerCase())},
      ] as const;
    }),
  );

export const startInstance = async (auth: FacilitatorAuthShape, cleanup: Array<() => Promise<void>>): Promise<Instance> => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'academy-google-login-test-'));
  const env = {
    ACADEMY_AUTHORING_ENABLED: 'true',
    ACADEMY_AUTHORING_KEY: 'synthetic-host-key',
    ACADEMY_AUTHORING_DATA_DIR: dataDir,
    AGENT_SLIDES_URL: 'https://upstream-slides.invalid',
    AGENT_SLIDES_TOKEN: 'upstream-token',
  };
  const app = Layer.mergeAll(GoogleSsoRoutes, AuthoringLive(env, {facilitators: auth})).pipe(Layer.provide(Layer.succeed(FacilitatorAuth, auth)));
  const web = HttpRouter.toWebHandler(app, {disableLogger: true});
  cleanup.push(async () => {
    await web.dispose();
    await rm(dataDir, {recursive: true, force: true});
  });
  const handler = (request: Request) => web.handler(request);
  const browser = (cookies = new Map<string, string>()): Browser => {
    const send = async (pathAndQuery: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      if (cookies.size) headers.set('cookie', [...cookies].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; '));
      const response = await handler(new Request(`${PUBLIC_URL}${pathAndQuery}`, {...init, headers, redirect: 'manual'}));
      for (const [name, {value, attributes}] of setCookies(response)) {
        if (attributes.some((attribute) => attribute === 'max-age=0' || attribute.startsWith('expires=thu, 01 jan 1970'))) cookies.delete(name);
        else cookies.set(name, value);
      }
      return response;
    };
    return {cookies, send, get: (pathAndQuery) => send(pathAndQuery, {method: 'GET'})};
  };
  return {handler, browser};
};

/** Start -> consent at the fake provider -> the callback path the browser follows. */
export const beginLogin = async (browser: Browser, oidc: FakeOidc, claims?: Record<string, unknown>) => {
  const started = await browser.get('/auth/google/start');
  const authorizeUrl = started.headers.get('location')!;
  return {started, authorizeUrl, callbackPath: oidc.consent(authorizeUrl, claims)};
};
