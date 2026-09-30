import {createServer} from 'node:http';
import {NodeHttpServer} from '@effect/platform-node';
import {Effect, Exit, Layer, Scope} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {ServicesLive, routes} from '../src/app.ts';
import {ServerConfigLive} from '../src/layers/config.ts';
import {
  CA_CERT,
  DATABASE_URL,
  POSTGRES_CONTAINER,
  REDIS_CONTAINER,
  REDIS_URL,
  dockerAvailable,
  pause,
  resume,
  startServices,
  stopServices,
  waitUntil,
} from './docker.ts';

const enabled = process.env.ACADEMY_WAVE_DOCKER_TEST === '1';
const APP_PORT = 43180;
const base = `http://127.0.0.1:${APP_PORT}`;

interface ConnectionBody {
  postgres: {reachable: boolean; error: string | null};
  redis: {reachable: boolean; error: string | null};
}

const getJson = async <T>(route: string): Promise<{status: number; body: T}> => {
  const response = await fetch(`${base}${route}`, {signal: AbortSignal.timeout(10_000)});
  return {status: response.status, body: (await response.json()) as T};
};

const connection = () => getJson<ConnectionBody>('/connection');
const health = () => getJson<{ok: boolean; revision: string | null}>('/health');

describe.skipIf(!enabled)('live services: outage and recovery without a process restart', () => {
  let scope: Scope.Closeable;

  beforeAll(async () => {
    if (!dockerAvailable()) throw new Error('ACADEMY_WAVE_DOCKER_TEST=1 requires a running Docker daemon');
    await startServices();
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: String(APP_PORT),
      HOST: '127.0.0.1',
      DATABASE_URL,
      REDIS_URL,
      SOURCE_REVISION: 'wave-foundation-test',
      ACADEMY_PUBLIC_URL: base,
      NODE_ENV: 'test',
      NODE_EXTRA_CA_CERTS: CA_CERT,
    };
    scope = await Effect.runPromise(Scope.make());
    const services = ServicesLive.pipe(Layer.provide(ServerConfigLive(env)));
    const app = routes(null).pipe(Layer.provide(services));
    const server = HttpRouter.serve(app, {disableListenLog: true, disableLogger: true}).pipe(
      Layer.provide(NodeHttpServer.layer(() => createServer(), {port: APP_PORT, host: '127.0.0.1'})),
    );
    await Effect.runPromise(Layer.buildWithScope(Layer.provideMerge(server, services), scope));
  }, 180_000);

  afterAll(async () => {
    if (scope) await Effect.runPromise(Scope.close(scope, Exit.void));
    stopServices();
  }, 60_000);

  test('boots and answers /health with every dependency reachable', async () => {
    await waitUntil('all dependencies reachable', async () => {
      const {body} = await connection();
      return body.postgres.reachable && body.redis.reachable;
    }, 90_000, 1000);
    const {status, body} = await health();
    expect(status).toBe(200);
    expect(body).toEqual({ok: true, revision: 'wave-foundation-test'});
  });

  test('stopping Postgres surfaces on /connection and /health, and restarting it recovers', async () => {
    pause(POSTGRES_CONTAINER);
    await waitUntil('postgres outage visible', async () => !(await connection()).body.postgres.reachable, 20_000);
    const during = await connection();
    expect(during.body.postgres.reachable).toBe(false);
    expect(during.body.postgres.error).toBeTruthy();
    expect(during.body.redis.reachable).toBe(true);
    const unhealthy = await health();
    expect(unhealthy.status).toBe(503);
    expect(unhealthy.body.ok).toBe(false);

    await resume(POSTGRES_CONTAINER);
    await waitUntil('postgres recovered', async () => (await connection()).body.postgres.reachable, 60_000, 1000);
    await waitUntil('health ok again', async () => (await health()).status === 200, 60_000, 1000);
    const recovered = await health();
    expect(recovered.body).toEqual({ok: true, revision: 'wave-foundation-test'});
  });

  test('stopping Redis is reported separately and recovers on restart', async () => {
    pause(REDIS_CONTAINER);
    await waitUntil('redis outage visible', async () => !(await connection()).body.redis.reachable, 20_000);
    const during = await connection();
    expect(during.body.redis.reachable).toBe(false);
    expect(during.body.postgres.reachable).toBe(true);
    expect((await health()).status).toBe(503);

    await resume(REDIS_CONTAINER);
    await waitUntil('redis recovered', async () => (await connection()).body.redis.reachable, 60_000, 1000);
    await waitUntil('health ok again', async () => (await health()).status === 200, 60_000, 1000);
  });
});

describe.skipIf(enabled)('live services test is opt-in', () => {
  test('skipped unless ACADEMY_WAVE_DOCKER_TEST=1 (needs Docker; see pnpm test:services)', () => {
    expect(enabled).toBe(false);
  });
});
