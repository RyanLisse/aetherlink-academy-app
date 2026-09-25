import {createHash} from 'node:crypto';
import {NodeChildProcessSpawner, NodeFileSystem, NodePath} from '@effect/platform-node';
import {PgClient} from '@effect/sql-pg';
import {Context, Effect, Exit, Layer, Redacted, Scope} from 'effect';
import type {SqlError} from 'effect/unstable/sql/SqlError';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import * as migrate from '../../src/db/migrate.ts';
import {FacilitatorAuth, FacilitatorAuthPg, type FacilitatorAuthShape} from '../../src/identity/facilitator-auth.ts';
import {dockerAvailable, startCurriculumPostgres, stopCurriculumPostgres, type CurriculumPostgresHandle} from '../curriculum-docker.ts';
import {startFakeOidc, type FakeOidc} from './fake-oidc.ts';
import {beginLogin, ssoFor, startInstance} from './login-harness.ts';

const enabled = process.env.ACADEMY_CURRICULUM_DB_TEST === '1';

const platformLayer = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
const layersFor = (url: string) => {
  const pgLayer = PgClient.layer({url: Redacted.make(url), maxConnections: 8, minConnections: 0, connectTimeout: '5 seconds'});
  return Layer.mergeAll(pgLayer, platformLayer, NodeChildProcessSpawner.layer.pipe(Layer.provide(platformLayer)));
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe.skipIf(!enabled)('AET-6 facilitator sessions persisted in an isolated Postgres', () => {
  let fixture: CurriculumPostgresHandle;
  let scope: Scope.Closeable;
  let context: Context.Context<Layer.Success<ReturnType<typeof layersFor>>>;
  let oidc: FakeOidc;
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    if (!dockerAvailable()) throw new Error('ACADEMY_CURRICULUM_DB_TEST=1 requires a running Docker daemon');
    fixture = await startCurriculumPostgres();
    scope = await Effect.runPromise(Scope.make());
    context = await Effect.runPromise(Layer.buildWithScope(layersFor(fixture.url), scope));
    const migrated = await Effect.runPromise(migrate.run.pipe(Effect.provide(context), Effect.result));
    if (migrated._tag === 'Failure') throw migrated.failure;
    oidc = await startFakeOidc();
  }, 120_000);

  afterEach(async () => {
    while (cleanup.length) await cleanup.pop()!();
  });

  afterAll(async () => {
    if (oidc) await oidc.close();
    if (scope) await Effect.runPromise(Scope.close(scope, Exit.void));
    if (fixture) stopCurriculumPostgres(fixture);
  }, 30_000);

  const sql = <A extends object>(text: string, params: ReadonlyArray<unknown> = []): Promise<ReadonlyArray<A>> =>
    Effect.runPromise(Effect.gen(function* () {
      const client = yield* PgClient.PgClient;
      return yield* client.unsafe<A>(text, params as unknown[]);
    }).pipe(Effect.provide(context)) as Effect.Effect<ReadonlyArray<A>, SqlError, never>);

  /** One server process: its own FacilitatorAuth built over the shared database. */
  const pgInstance = async () => {
    const auth = await Effect.runPromise(Effect.gen(function* () {
      return yield* FacilitatorAuth;
    }).pipe(Effect.provide(FacilitatorAuthPg(ssoFor(oidc)).pipe(Layer.provide(Layer.succeedContext(context))))) as Effect.Effect<FacilitatorAuthShape, never, never>);
    return startInstance(auth, cleanup);
  };

  test('migration 0006 creates both tables', async () => {
    const tables = await sql<{table_name: string}>(
      `select table_name from information_schema.tables where table_schema = 'academy_curriculum' and table_name like 'facilitator_%' order by table_name`,
    );
    expect(tables.map((row) => row.table_name)).toEqual(['facilitator_credentials', 'facilitator_login_states', 'facilitator_sessions']);
  });

  test('login started on instance A completes on instance B; the session stores only a hash and resolves on A', async () => {
    const a = await pgInstance();
    const b = await pgInstance();
    const browserOnA = a.browser();
    const {callbackPath} = await beginLogin(browserOnA, oidc);
    const state = new URL(callbackPath, 'https://x.test').searchParams.get('state')!;
    expect(await sql(`select 1 from academy_curriculum.facilitator_login_states where state_hash = $1`, [sha256(state)])).toHaveLength(1);

    const browserOnB = b.browser();
    const done = await browserOnB.get(callbackPath);
    expect(done.headers.get('location')).toBe('/?facilitator=1');
    expect(await sql(`select 1 from academy_curriculum.facilitator_login_states where state_hash = $1`, [sha256(state)])).toHaveLength(0);

    const token = browserOnB.cookies.get('academy-facilitator')!;
    const rows = await sql<{token_hash: string; email: string; domain: string; sub: string; ttl_hours: string}>(
      `select token_hash, email, domain, sub, round(extract(epoch from (expires_at - created_at)) / 3600)::text as ttl_hours
         from academy_curriculum.facilitator_sessions where token_hash = $1`,
      [sha256(token)],
    );
    expect(rows).toEqual([{token_hash: sha256(token), email: 'ada@facilitators.example', domain: 'facilitators.example', sub: 'synthetic-google-subject', ttl_hours: '12'}]);
    expect(await sql(`select 1 from academy_curriculum.facilitator_sessions where token_hash = $1`, [token])).toHaveLength(0);

    const sameCookieOnA = a.browser(new Map([['academy-facilitator', token]]));
    expect((await sameCookieOnA.get('/authoring-api/lessons')).status).toBe(200);
  });

  test('replaying a consumed callback against another instance answers login_error=state', async () => {
    const a = await pgInstance();
    const b = await pgInstance();
    const {callbackPath} = await beginLogin(a.browser(), oidc);
    expect((await b.browser().get(callbackPath)).headers.get('location')).toBe('/?facilitator=1');
    expect((await a.browser().get(callbackPath)).headers.get('location')).toBe('/?login_error=state');
  });

  test('an expired session row no longer authorizes', async () => {
    const a = await pgInstance();
    const browser = a.browser();
    const {callbackPath} = await beginLogin(browser, oidc);
    await browser.get(callbackPath);
    expect((await browser.get('/authoring-api/lessons')).status).toBe(200);
    const token = browser.cookies.get('academy-facilitator')!;
    await sql(`update academy_curriculum.facilitator_sessions set expires_at = now() - interval '1 second' where token_hash = $1`, [sha256(token)]);
    expect((await browser.get('/authoring-api/lessons')).status).toBe(401);
  });

  test('logout on one instance deletes the row, so the cookie fails everywhere', async () => {
    const a = await pgInstance();
    const b = await pgInstance();
    const browser = a.browser();
    const {callbackPath} = await beginLogin(browser, oidc);
    await browser.get(callbackPath);
    const token = browser.cookies.get('academy-facilitator')!;
    expect((await browser.send('/auth/logout', {method: 'POST'})).status).toBe(204);
    expect(await sql(`select 1 from academy_curriculum.facilitator_sessions where token_hash = $1`, [sha256(token)])).toHaveLength(0);
    expect((await b.browser(new Map([['academy-facilitator', token]])).get('/authoring-api/lessons')).status).toBe(401);
  });

  test('a disallowed domain leaves no session row behind', async () => {
    const a = await pgInstance();
    const before = await sql<{count: string}>(`select count(*)::text as count from academy_curriculum.facilitator_sessions`);
    const browser = a.browser();
    const {callbackPath} = await beginLogin(browser, oidc, {email: 'learner@participants.example', hd: 'participants.example'});
    expect((await browser.get(callbackPath)).headers.get('location')).toBe('/?login_error=domain');
    expect(await sql(`select count(*)::text as count from academy_curriculum.facilitator_sessions`)).toEqual(before);
  });
});
