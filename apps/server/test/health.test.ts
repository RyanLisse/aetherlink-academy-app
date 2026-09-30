import {NodeHttpServer} from '@effect/platform-node';
import {Effect, Layer} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {afterEach, describe, expect, test} from 'vitest';
import {ApiRoutes} from '../src/app.ts';
import {ServerConfig, type ServerConfigShape} from '../src/layers/config.ts';
import {ConnectivityLive} from '../src/layers/connectivity.ts';
import {PostgresUnreachable, RedisUnreachable} from '../src/layers/errors.ts';
import {Postgres} from '../src/layers/postgres.ts';
import {Redis} from '../src/layers/redis.ts';

const config: ServerConfigShape = {
  host: '127.0.0.1',
  port: 4318,
  publicUrl: 'http://127.0.0.1:4318',
  revision: 'deadbeef',
  databaseUrl: 'postgresql://fixture.invalid/academy',
  redisUrl: 'redis://fixture.invalid:6379',
  webDist: null,
};

interface Fakes {
  postgres: boolean;
  redis: boolean;
}

const fakes = (state: Fakes) =>
  Layer.mergeAll(
    Layer.succeed(ServerConfig, config),
    Layer.succeed(Postgres, {
      ping: Effect.suspend(() => (state.postgres ? Effect.void : Effect.fail(new PostgresUnreachable({message: 'ECONNREFUSED 127.0.0.1:55438'})))),
    }),
    Layer.succeed(Redis, {
      ping: Effect.suspend(() => (state.redis ? Effect.void : Effect.fail(new RedisUnreachable({message: 'Connection is closed.'})))),
      status: Effect.succeed(state.redis ? 'ready' : 'reconnecting'),
    }),
  );

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (disposers.length) await disposers.pop()!();
});

const handlerFor = (state: Fakes) => {
  const app = ApiRoutes.pipe(Layer.provide(ConnectivityLive), Layer.provide(fakes(state)), Layer.provide(NodeHttpServer.layerHttpServices));
  const web = HttpRouter.toWebHandler(app, {disableLogger: true});
  disposers.push(web.dispose);
  return (path: string) => web.handler(new Request(`http://academy.test${path}`));
};

describe('GET /health reflects the real dependency probes', () => {
  test('all dependencies reachable → 200 {ok:true, revision}', async () => {
    const request = handlerFor({postgres: true, redis: true});
    const response = await request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ok: true, revision: 'deadbeef'});
  });

  test('Postgres down → 503 with ok:false', async () => {
    const request = handlerFor({postgres: false, redis: true});
    const response = await request('/health');
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ok: false, revision: 'deadbeef'});
  });

  test('a dependency flipping at runtime changes the answer without rebuilding the handler', async () => {
    const state: Fakes = {postgres: true, redis: true};
    const request = handlerFor(state);
    expect((await request('/health')).status).toBe(200);
    state.redis = false;
    expect(await (await request('/health')).json()).toMatchObject({ok: false});
    state.redis = true;
    expect((await request('/health')).status).toBe(200);
  });
});

describe('GET /connection reports each dependency separately', () => {
  test('reports reachable flags, latency, timestamps and the error text of the failing probe', async () => {
    const request = handlerFor({postgres: false, redis: true});
    const response = await request('/connection');
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<'postgres' | 'redis', {latencyMs: unknown; checkedAt: string}> & {checkedAt: string};
    expect(body.postgres).toMatchObject({reachable: false, error: 'PostgresUnreachable: ECONNREFUSED 127.0.0.1:55438'});
    expect(body.redis).toMatchObject({reachable: true, error: null});
    expect(Object.hasOwn(body, 'proof')).toBe(false);
    for (const key of ['postgres', 'redis'] as const) {
      expect(typeof body[key].latencyMs).toBe('number');
      expect(Number.isNaN(Date.parse(body[key].checkedAt))).toBe(false);
    }
    expect(Number.isNaN(Date.parse(body.checkedAt))).toBe(false);
  });
});
