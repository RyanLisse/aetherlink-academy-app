import {Effect, Layer} from 'effect';
import {describe, expect, test} from 'vitest';
import {agentInstructions} from '../../src/identity/agent-setup.ts';
import {authorizeMcpBearer, TokenService, TokenServiceLive} from '../../src/identity/tokens.ts';
import {runSquad, SquadStore, SquadStoreMemory} from '../../src/squad/store.ts';

describe('agent setup + MCP revoke', () => {
  test('instructions bind agent to participant and never leak browser token', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Squad', {slug: 'intent'});
      const alice = yield* store.join(host.code, 'Alice');
      const auth = yield* store.auth(alice.token);
      const mcpToken = yield* store.mintSession(auth.r.id, auth.p!.id, 'mcp');
      const text = agentInstructions({
        origin: 'https://academy.example.test',
        roomId: auth.r.id,
        participantId: auth.p!.id,
        accessToken: mcpToken,
      });
      expect(text).toMatch(/--scope local/);
      expect(text).toContain(auth.r.id);
      expect(text).toContain(auth.p!.id);
      expect(text).not.toContain(alice.token);
      expect(text).toContain(mcpToken);
    }));
  });

  test('revoking MCP token makes next /mcp auth fail with 401 in the same test', async () => {
    const live = TokenServiceLive.pipe(Layer.provideMerge(SquadStoreMemory()));
    await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* SquadStore;
        const tokens = yield* TokenService;
        const host = yield* store.create('Revoke', {slug: 'revoke'});
        const join = yield* store.join(host.code, 'Ada');
        const auth = yield* store.auth(join.token);
        const mcp = yield* tokens.mint(auth.r.id, auth.p!.id, 'mcp');
        const ok = yield* authorizeMcpBearer(tokens, `Bearer ${mcp}`);
        expect(ok.personId).toBe(auth.p!.id);
        yield* tokens.revokeMcp(auth.r.id, auth.p!.id);
        const denied = yield* Effect.exit(authorizeMcpBearer(tokens, `Bearer ${mcp}`));
        expect(denied._tag).toBe('Failure');
        expect(yield* tokens.connectionState(auth.r.id, auth.p!.id)).toBe('configured');
      }).pipe(Effect.provide(live)),
    );
  });
});
