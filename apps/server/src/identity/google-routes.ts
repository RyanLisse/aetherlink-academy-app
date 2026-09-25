import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {Duration, Effect, Layer} from 'effect';
import {HttpRouter, type HttpServerRequest, HttpServerResponse} from 'effect/unstable/http';
import {FacilitatorAuth, type FacilitatorAuthShape, type LoginState} from './facilitator-auth.ts';
import {SESSION_TTL_MS} from '../squad/types.ts';
import {readLoginState, signLoginState} from './google-sso.ts';

export const FACILITATOR_COOKIE = 'academy-facilitator';
export const LOGIN_COOKIE = 'academy-login';
const LOGIN_TTL_MS = 10 * 60 * 1000;

/** The codes the SPA reads from `/?login_error=`; identical to the gateway's set in `server/app.mjs`. */
export type LoginErrorCode = 'state' | 'domain' | 'token' | 'verify' | 'disabled' | 'session';
const LOGIN_ERROR_CODES: ReadonlySet<string> = new Set<LoginErrorCode>(['state', 'domain', 'token', 'verify', 'disabled', 'session']);

class LoginFailure {
  constructor(
    readonly code: LoginErrorCode,
    readonly reason: string | null,
  ) {}
}

const toLoginFailure = (error: unknown): LoginFailure => {
  if (error instanceof LoginFailure) return error;
  const code = (error as {code?: unknown} | null)?.code;
  const reason = (error as {reason?: unknown} | null)?.reason;
  return new LoginFailure(typeof code === 'string' && LOGIN_ERROR_CODES.has(code) ? (code as LoginErrorCode) : 'session', typeof reason === 'string' ? reason : null);
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const randomToken = () => randomBytes(32).toString('base64url');
const sameString = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

const cookieOptions = (auth: FacilitatorAuthShape) => ({httpOnly: true, sameSite: 'lax', secure: auth.redirectUri.startsWith('https:'), path: '/'}) as const;

const loginErrorResponse = (auth: FacilitatorAuthShape, failure: LoginFailure) =>
  Effect.gen(function* () {
    yield* Effect.logWarning('[academy] Google-login mislukt').pipe(Effect.annotateLogs({code: failure.code, reason: failure.reason}));
    return HttpServerResponse.redirect(`/?login_error=${failure.code}`).pipe(HttpServerResponse.expireCookieUnsafe(LOGIN_COOKIE, cookieOptions(auth)));
  });

const start = (auth: FacilitatorAuthShape) =>
  Effect.gen(function* () {
    if (!auth.enabled) return yield* Effect.fail(new LoginFailure('disabled', 'config'));
    const state = randomToken();
    const nonce = randomToken();
    const codeVerifier = randomToken();
    const expiresAt = Date.now() + LOGIN_TTL_MS;
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const location = yield* auth.startUrl({state, nonce, codeChallenge});
    yield* auth.saveLoginState(sha256(state), {nonce, codeVerifier, expiresAt});
    return HttpServerResponse.redirect(location).pipe(
      HttpServerResponse.setCookieUnsafe(LOGIN_COOKIE, signLoginState({state, nonce, codeVerifier, expiresAt}, auth.loginStateKey), {
        ...cookieOptions(auth),
        maxAge: '10 minutes',
      }),
    );
  });

/**
 * The signed `academy-login` cookie binds the callback to the browser that
 * started the login. When the cookie did not survive the round trip, the
 * server-side record (single use) still completes it, as on the gateway.
 */
const resolveLoginState = (auth: FacilitatorAuthShape, request: HttpServerRequest.HttpServerRequest, queryState: string | null) =>
  Effect.gen(function* () {
    const cookieValue = request.cookies[LOGIN_COOKIE];
    let reason: string = 'no-cookie';
    let fromCookie: (LoginState & {state: string}) | null = null;
    if (cookieValue) {
      try {
        const candidate = readLoginState(cookieValue, auth.loginStateKey) as LoginState & {state: string};
        if (candidate.expiresAt < Date.now()) reason = 'expired';
        else if (!queryState || !sameString(queryState, String(candidate.state))) reason = 'mismatch';
        else fromCookie = candidate;
      } catch (error) {
        reason = toLoginFailure(error).reason ?? 'bad-signature';
      }
    }
    if (!queryState) return yield* Effect.fail(new LoginFailure('state', reason));
    const record = yield* auth.takeLoginState(sha256(queryState));
    if (fromCookie) return fromCookie;
    if (record) return {...record, state: queryState};
    return yield* Effect.fail(new LoginFailure('state', `${reason}+no-server-state`));
  });

const callback = (auth: FacilitatorAuthShape, request: HttpServerRequest.HttpServerRequest) =>
  Effect.gen(function* () {
    if (!auth.enabled) return yield* Effect.fail(new LoginFailure('disabled', 'config'));
    const query = new URL(request.url, 'http://academy.local').searchParams;
    const state = query.get('state');
    const code = query.get('code') ?? undefined;
    const loginState = yield* resolveLoginState(auth, request, state || null);
    const identity = yield* auth.handleCallback({state: state ?? undefined, code}, loginState);
    const token = yield* auth.login(identity).pipe(Effect.mapError(() => new LoginFailure('session', 'store')));
    return HttpServerResponse.redirect('/?facilitator=1').pipe(
      HttpServerResponse.expireCookieUnsafe(LOGIN_COOKIE, cookieOptions(auth)),
      HttpServerResponse.setCookieUnsafe(FACILITATOR_COOKIE, token, {...cookieOptions(auth), maxAge: Duration.millis(SESSION_TTL_MS)}),
    );
  });

const logout = (auth: FacilitatorAuthShape, request: HttpServerRequest.HttpServerRequest) =>
  auth.logout(request.cookies[FACILITATOR_COOKIE]).pipe(
    Effect.as(HttpServerResponse.empty({status: 204}).pipe(HttpServerResponse.expireCookieUnsafe(FACILITATOR_COOKIE, cookieOptions(auth)))),
    Effect.catch(() => Effect.succeed(HttpServerResponse.jsonUnsafe({error: 'Uitloggen mislukt.'}, {status: 503}))),
  );

const loginFlow = (auth: FacilitatorAuthShape, flow: Effect.Effect<HttpServerResponse.HttpServerResponse, unknown>) =>
  flow.pipe(Effect.catch((error) => loginErrorResponse(auth, toLoginFailure(error))));

/**
 * Google SSO for facilitators, same contract as the gateway (`server/app.mjs`):
 * `GET /auth/google/start`, `GET /auth/google/callback` and `POST /auth/logout`.
 * Mounted even when SSO is off, so a stale login link lands on
 * `/?login_error=disabled` instead of the SPA fallback.
 */
export const GoogleSsoRoutes: Layer.Layer<never, never, HttpRouter.HttpRouter | FacilitatorAuth> = Layer.unwrap(
  Effect.gen(function* () {
    const auth = yield* FacilitatorAuth;
    return Layer.mergeAll(
      HttpRouter.add('GET', '/auth/google/start', loginFlow(auth, start(auth))),
      HttpRouter.add('GET', '/auth/google/callback', (request) => loginFlow(auth, callback(auth, request))),
      HttpRouter.add('POST', '/auth/logout', (request) => logout(auth, request)),
    );
  }),
);
