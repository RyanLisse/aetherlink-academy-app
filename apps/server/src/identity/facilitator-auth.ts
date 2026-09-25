import {Context, Effect, Layer, Ref} from 'effect';
import {hashToken, mintSecret} from '../squad/crypto.ts';
import {SESSION_TTL_MS} from '../squad/types.ts';
import {
  createGoogleSso,
  googleSsoFromEnv,
  type FacilitatorIdentity,
} from './google-sso.ts';
import {signLoginState, readLoginState} from './google-sso.ts';

export interface FacilitatorSession {
  readonly sub: string;
  readonly email: string;
  readonly name: string;
  readonly domain: string;
  readonly expiresAt: number;
}

export interface LoginState {
  readonly nonce: string;
  readonly codeVerifier: string;
  readonly expiresAt: number;
  readonly state: string;
}

export interface FacilitatorAuthShape {
  readonly enabled: boolean;
  readonly redirectUri: string;
  readonly login: (identity: FacilitatorIdentity) => Effect.Effect<string, unknown>;
  readonly current: (token: string | null | undefined) => Effect.Effect<FacilitatorSession | null>;
  readonly logout: (token: string | null | undefined) => Effect.Effect<void>;
  readonly saveLoginState: (state: LoginState & {stateHash: string}) => Effect.Effect<void>;
  readonly takeLoginState: (stateHash: string) => Effect.Effect<LoginState | null>;
  readonly startUrl: (input: {state: string; nonce: string; codeChallenge: string}) => Effect.Effect<string, unknown>;
  readonly handleCallback: (
    query: {state?: string; code?: string},
    loginState: (LoginState & {state: string}) | null,
  ) => Effect.Effect<FacilitatorIdentity, unknown>;
}

export class FacilitatorAuth extends Context.Service<FacilitatorAuth, FacilitatorAuthShape>()(
  '@academy/server/FacilitatorAuth',
) {}

export const FacilitatorAuthMemory = (
  sso: ReturnType<typeof createGoogleSso> = googleSsoFromEnv(),
): Layer.Layer<FacilitatorAuth> =>
  Layer.effect(
    FacilitatorAuth,
    Effect.gen(function* () {
      const sessions = yield* Ref.make(new Map<string, FacilitatorSession>());
      const loginStates = yield* Ref.make(new Map<string, LoginState>());

      const shape: FacilitatorAuthShape = {
        enabled: sso.enabled,
        redirectUri: new URL('/auth/google/callback', process.env.ACADEMY_PUBLIC_URL || 'http://127.0.0.1:4318').href,
        login: (identity) =>
          Effect.gen(function* () {
            const now = Date.now();
            yield* Ref.update(sessions, (map) => {
              const next = new Map(map);
              for (const [k, v] of next) if (v.expiresAt < now) next.delete(k);
              return next;
            });
            const token = mintSecret();
            yield* Ref.update(sessions, (map) => {
              const next = new Map(map);
              next.set(hashToken(token), {...identity, expiresAt: now + SESSION_TTL_MS});
              return next;
            });
            return token;
          }),
        current: (token) =>
          Effect.gen(function* () {
            if (!token) return null;
            const map = yield* Ref.get(sessions);
            const key = hashToken(token);
            const identity = map.get(key);
            if (!identity) return null;
            if (identity.expiresAt < Date.now()) {
              yield* Ref.update(sessions, (m) => {
                const next = new Map(m);
                next.delete(key);
                return next;
              });
              return null;
            }
            const {sub, email, name, domain, expiresAt} = identity;
            return {sub, email, name, domain, expiresAt};
          }),
        logout: (token) =>
          Effect.gen(function* () {
            if (!token) return;
            yield* Ref.update(sessions, (m) => {
              const next = new Map(m);
              next.delete(hashToken(token));
              return next;
            });
          }),
        saveLoginState: ({stateHash, nonce, codeVerifier, expiresAt, state}) =>
          Ref.update(loginStates, (m) => {
            const next = new Map(m);
            for (const [k, v] of next) if (v.expiresAt < Date.now()) next.delete(k);
            next.set(stateHash, {nonce, codeVerifier, expiresAt, state});
            return next;
          }),
        takeLoginState: (stateHash) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(loginStates);
            const record = map.get(stateHash);
            yield* Ref.update(loginStates, (m) => {
              const next = new Map(m);
              next.delete(stateHash);
              return next;
            });
            if (!record || record.expiresAt < Date.now()) return null;
            return record;
          }),
        startUrl: (input) => Effect.tryPromise(() => sso.startUrl(input)),
        handleCallback: (query, loginState) => Effect.tryPromise(() => sso.handleCallback(query, loginState)),
      };
      return shape;
    }),
  );

export {signLoginState, readLoginState, createGoogleSso, googleSsoFromEnv};
export type {FacilitatorIdentity};
