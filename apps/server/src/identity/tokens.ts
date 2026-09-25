import {Context, Effect, Layer} from 'effect';
import {SquadStore} from '../squad/store.ts';
import type {ConnectionState, SessionKind} from '../squad/types.ts';

export interface TokenServiceShape {
  readonly mint: (
    roomId: string,
    personId: string,
    kind: SessionKind,
    displayName?: string,
  ) => Effect.Effect<string>;
  readonly authenticate: (
    token: string,
    kind?: SessionKind,
  ) => Effect.Effect<{roomId: string; personId: string; kind: SessionKind}, unknown>;
  readonly revokeMcp: (roomId: string, personId: string) => Effect.Effect<number>;
  readonly rotateMcp: (roomId: string, personId: string) => Effect.Effect<string>;
  readonly connectionState: (roomId: string, personId: string) => Effect.Effect<ConnectionState>;
}

export class TokenService extends Context.Service<TokenService, TokenServiceShape>()('@academy/server/TokenService') {}

export const TokenServiceLive: Layer.Layer<TokenService, never, SquadStore> = Layer.effect(
  TokenService,
  Effect.gen(function* () {
    const squad = yield* SquadStore;
    const configured = new Set<string>();
    const connected = new Set<string>();
    const verified = new Set<string>();
    const keyOf = (roomId: string, personId: string) => `${roomId}:${personId}`;

    const shape: TokenServiceShape = {
      mint: (roomId, personId, kind, displayName) =>
        Effect.gen(function* () {
          const token = yield* squad.mintSession(roomId, personId, kind, displayName);
          if (kind === 'mcp') {
            const k = keyOf(roomId, personId);
            configured.add(k);
            connected.add(k);
          }
          return token;
        }),
      authenticate: (token, kind) =>
        Effect.gen(function* () {
          const ctx = yield* squad.auth(token, kind);
          if (ctx.s.kind === 'mcp') verified.add(keyOf(ctx.s.roomId, ctx.s.personId));
          return {roomId: ctx.s.roomId, personId: ctx.s.personId, kind: ctx.s.kind};
        }),
      revokeMcp: (roomId, personId) =>
        Effect.gen(function* () {
          const n = yield* squad.revokeSessions(roomId, personId, 'mcp');
          const k = keyOf(roomId, personId);
          connected.delete(k);
          verified.delete(k);
          return n;
        }),
      rotateMcp: (roomId, personId) =>
        Effect.gen(function* () {
          yield* squad.revokeSessions(roomId, personId, 'mcp');
          return yield* shape.mint(roomId, personId, 'mcp');
        }),
      connectionState: (roomId, personId) =>
        Effect.sync(() => {
          const k = keyOf(roomId, personId);
          if (verified.has(k)) return 'verified' as const;
          if (connected.has(k)) return 'connected' as const;
          if (configured.has(k)) return 'configured' as const;
          return 'configured' as const;
        }),
    };
    return shape;
  }),
);

/** Test/helper MCP bearer check — does not live under apps/server/src/mcp/. */
export const authorizeMcpBearer = (
  tokens: TokenServiceShape,
  authorizationHeader: string | null | undefined,
): Effect.Effect<{roomId: string; personId: string}, {readonly status: 401; readonly message: string}> =>
  Effect.gen(function* () {
    const raw = authorizationHeader || '';
    const match = /^Bearer\s+(.+)$/i.exec(raw);
    if (!match?.[1]) {
      return yield* Effect.fail({status: 401 as const, message: 'missing bearer'});
    }
    return yield* tokens.authenticate(match[1], 'mcp').pipe(
      Effect.map((s) => ({roomId: s.roomId, personId: s.personId})),
      Effect.mapError(() => ({status: 401 as const, message: 'invalid mcp token'})),
    );
  });
