import {PgClient} from '@effect/sql-pg';
import {Context, Data, Effect, Layer, Ref} from 'effect';
import {ServerConfig} from '../layers/config.ts';
import {ConfigError} from '../layers/errors.ts';
import {PgClientLive} from '../layers/postgres.ts';
import {hashToken, mintSecret} from '../squad/crypto.ts';
import {SESSION_TTL_MS} from '../squad/types.ts';
import {
  createGoogleSso,
  googleSsoFromEnv,
  type FacilitatorIdentity,
  type GoogleSso,
} from './google-sso.ts';
import {signLoginState, readLoginState} from './google-sso.ts';

export interface FacilitatorSession {
  readonly sub: string;
  readonly email: string;
  readonly name: string;
  readonly domain: string;
  readonly expiresAt: number;
}

/** Server-side half of a pending Google login, keyed by sha256(state). */
export interface LoginState {
  readonly nonce: string;
  readonly codeVerifier: string;
  readonly expiresAt: number;
}

export class FacilitatorStoreUnavailable extends Data.TaggedError('FacilitatorStoreUnavailable')<{readonly cause: unknown}> {}

/** Persistence for sessions and pending logins. Tokens and states only ever arrive here hashed. */
export interface FacilitatorStore {
  readonly insertSession: (tokenHash: string, session: FacilitatorSession) => Effect.Effect<void, FacilitatorStoreUnavailable>;
  readonly findSession: (tokenHash: string) => Effect.Effect<FacilitatorSession | null, FacilitatorStoreUnavailable>;
  readonly deleteSession: (tokenHash: string) => Effect.Effect<void, FacilitatorStoreUnavailable>;
  readonly saveLoginState: (stateHash: string, state: LoginState) => Effect.Effect<void, FacilitatorStoreUnavailable>;
  /** Single use: returns the live record and deletes it in the same step. */
  readonly takeLoginState: (stateHash: string) => Effect.Effect<LoginState | null, FacilitatorStoreUnavailable>;
}

export interface FacilitatorAuthShape {
  readonly enabled: boolean;
  readonly redirectUri: string;
  /** HMAC key for the `academy-login` cookie. */
  readonly loginStateKey: Buffer;
  readonly login: (identity: FacilitatorIdentity) => Effect.Effect<string, FacilitatorStoreUnavailable>;
  readonly current: (token: string | null | undefined) => Effect.Effect<FacilitatorSession | null, FacilitatorStoreUnavailable>;
  readonly logout: (token: string | null | undefined) => Effect.Effect<void, FacilitatorStoreUnavailable>;
  readonly saveLoginState: (stateHash: string, state: LoginState) => Effect.Effect<void, FacilitatorStoreUnavailable>;
  readonly takeLoginState: (stateHash: string) => Effect.Effect<LoginState | null, FacilitatorStoreUnavailable>;
  readonly startUrl: (input: {state: string; nonce: string; codeChallenge: string}) => Effect.Effect<string, unknown>;
  readonly handleCallback: (
    query: {readonly state?: string | undefined; readonly code?: string | undefined},
    loginState: (LoginState & {state: string}) | null,
  ) => Effect.Effect<FacilitatorIdentity, unknown>;
}

export class FacilitatorAuth extends Context.Service<FacilitatorAuth, FacilitatorAuthShape>()(
  '@academy/server/FacilitatorAuth',
) {}

export const makeFacilitatorAuth = (sso: GoogleSso, store: FacilitatorStore): FacilitatorAuthShape => ({
  enabled: sso.enabled,
  redirectUri: sso.redirectUri,
  loginStateKey: sso.loginStateKey,
  login: (identity) =>
    Effect.gen(function* () {
      const token = mintSecret();
      const {sub, email, name, domain} = identity;
      yield* store.insertSession(hashToken(token), {sub, email, name, domain, expiresAt: Date.now() + SESSION_TTL_MS});
      return token;
    }),
  current: (token) => (token ? store.findSession(hashToken(token)) : Effect.succeed(null)),
  logout: (token) => (token ? store.deleteSession(hashToken(token)) : Effect.void),
  saveLoginState: store.saveLoginState,
  takeLoginState: store.takeLoginState,
  startUrl: (input) => Effect.tryPromise({try: () => sso.startUrl(input), catch: (error) => error}),
  handleCallback: (query, loginState) => Effect.tryPromise({try: () => sso.handleCallback(query, loginState), catch: (error) => error}),
});

const memoryStore = Effect.gen(function* () {
  const sessions = yield* Ref.make(new Map<string, FacilitatorSession>());
  const loginStates = yield* Ref.make(new Map<string, LoginState>());
  const live = <V extends {expiresAt: number}>(map: Map<string, V>) => new Map([...map].filter(([, value]) => value.expiresAt > Date.now()));
  const store: FacilitatorStore = {
    insertSession: (tokenHash, session) => Ref.update(sessions, (map) => live(map).set(tokenHash, session)),
    findSession: (tokenHash) => Ref.get(sessions).pipe(Effect.map((map) => live(map).get(tokenHash) ?? null)),
    deleteSession: (tokenHash) =>
      Ref.update(sessions, (map) => {
        const next = new Map(map);
        next.delete(tokenHash);
        return next;
      }),
    saveLoginState: (stateHash, state) => Ref.update(loginStates, (map) => live(map).set(stateHash, state)),
    takeLoginState: (stateHash) =>
      Ref.modify(loginStates, (map) => {
        const next = live(map);
        const record = next.get(stateHash) ?? null;
        next.delete(stateHash);
        return [record, next];
      }),
  };
  return store;
});

/** Single-process store for unit tests; production uses `FacilitatorAuthPg`. */
export const FacilitatorAuthMemory = (sso: GoogleSso = googleSsoFromEnv()): Layer.Layer<FacilitatorAuth> =>
  Layer.effect(FacilitatorAuth, memoryStore.pipe(Effect.map((store) => makeFacilitatorAuth(sso, store))));

interface SessionRow {
  readonly sub: string;
  readonly email: string;
  readonly name: string;
  readonly domain: string;
  readonly expiresAt: Date;
}

interface LoginStateRow {
  readonly nonce: string;
  readonly codeVerifier: string;
  readonly expiresAt: Date;
}

const unavailable = Effect.mapError((cause: unknown) => new FacilitatorStoreUnavailable({cause}));

/**
 * Sessions and pending logins live in `academy_curriculum.facilitator_sessions`
 * and `facilitator_login_states` (migration 0006), so any instance can resolve a
 * cookie minted by another and a restart logs nobody out. Expiry is enforced in
 * the query, not by a sweeper, so a stale row can never authorize.
 */
export const pgFacilitatorStore = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient;
  const store: FacilitatorStore = {
    insertSession: (tokenHash, session) =>
      Effect.gen(function* () {
        yield* sql`delete from academy_curriculum.facilitator_sessions where expires_at <= now()`;
        yield* sql`insert into academy_curriculum.facilitator_sessions (token_hash, sub, email, name, domain, expires_at)
          values (${tokenHash}, ${session.sub}, ${session.email}, ${session.name}, ${session.domain}, ${new Date(session.expiresAt)})`;
      }).pipe(unavailable),
    findSession: (tokenHash) =>
      sql<SessionRow>`select sub, email, name, domain, expires_at as "expiresAt" from academy_curriculum.facilitator_sessions
        where token_hash = ${tokenHash} and expires_at > now()`.pipe(
        Effect.map(([row]) => (row ? {sub: row.sub, email: row.email, name: row.name, domain: row.domain, expiresAt: new Date(row.expiresAt).getTime()} : null)),
        unavailable,
      ),
    deleteSession: (tokenHash) => sql`delete from academy_curriculum.facilitator_sessions where token_hash = ${tokenHash}`.pipe(Effect.asVoid, unavailable),
    saveLoginState: (stateHash, state) =>
      Effect.gen(function* () {
        yield* sql`delete from academy_curriculum.facilitator_login_states where expires_at <= now()`;
        yield* sql`insert into academy_curriculum.facilitator_login_states (state_hash, nonce, code_verifier, expires_at)
          values (${stateHash}, ${state.nonce}, ${state.codeVerifier}, ${new Date(state.expiresAt)})`;
      }).pipe(unavailable),
    takeLoginState: (stateHash) =>
      sql<LoginStateRow>`delete from academy_curriculum.facilitator_login_states where state_hash = ${stateHash}
        returning nonce, code_verifier as "codeVerifier", expires_at as "expiresAt"`.pipe(
        Effect.map(([row]) =>
          row && new Date(row.expiresAt).getTime() > Date.now() ? {nonce: row.nonce, codeVerifier: row.codeVerifier, expiresAt: new Date(row.expiresAt).getTime()} : null,
        ),
        unavailable,
      ),
  };
  return store;
});

export const FacilitatorAuthPg = (sso: GoogleSso): Layer.Layer<FacilitatorAuth, never, PgClient.PgClient> =>
  Layer.effect(FacilitatorAuth, pgFacilitatorStore.pipe(Effect.map((store) => makeFacilitatorAuth(sso, store))));

/** Production wiring: env-configured Google SSO, sessions in the service's Postgres. Partial Google env fails the boot. */
export const FacilitatorAuthFromEnv = (env: NodeJS.ProcessEnv): Layer.Layer<FacilitatorAuth, ConfigError, ServerConfig> =>
  Layer.unwrap(
    Effect.gen(function* () {
      const config = yield* ServerConfig;
      const sso = yield* Effect.try({
        try: () => googleSsoFromEnv({...env, ACADEMY_PUBLIC_URL: config.publicUrl}),
        catch: (error) => new ConfigError({key: 'GOOGLE_CLIENT_ID', message: error instanceof Error ? error.message : String(error)}),
      });
      return FacilitatorAuthPg(sso).pipe(Layer.provide(PgClientLive));
    }),
  );

export {signLoginState, readLoginState, createGoogleSso, googleSsoFromEnv};
export type {FacilitatorIdentity};
