import {randomUUID} from 'node:crypto';
import {NodeChildProcessSpawner, NodeFileSystem, NodePath} from '@effect/platform-node';
import {PgClient} from '@effect/sql-pg';
import {ConfirmationStoreLive, dispatch, registry, ReleasePolicy, type Caller} from '@academy/actions';
import {Context, Effect, Exit, Layer, Redacted, Scope} from 'effect';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {CurriculumRepo, CurriculumRepoLive} from '../src/db/curriculum-repo.ts';
import * as migrate from '../src/db/migrate.ts';
import {ReleasePolicyFromStore} from '../src/release/policy-layer.ts';
import {ReleaseStore, ReleaseStoreMemory} from '../src/release/store.ts';
import {ContentSearchPostgres} from '../src/search/search-repo.ts';
import {dockerAvailable, startCurriculumPostgres, stopCurriculumPostgres, type CurriculumPostgresHandle} from './curriculum-docker.ts';
import {searchCurriculumDraft} from './fixtures/search-curriculum.ts';

const enabled = process.env.ACADEMY_SEARCH_DB_TEST === '1';

const platformLayer = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
const spawnerLayer = NodeChildProcessSpawner.layer.pipe(Layer.provide(platformLayer));
const layersFor = (url: string) => {
  const pgLayer = PgClient.layer({url: Redacted.make(url), maxConnections: 4, minConnections: 0, connectTimeout: '5 seconds'});
  const releaseLayer = ReleasePolicyFromStore.pipe(Layer.provideMerge(ReleaseStoreMemory()));
  return Layer.mergeAll(
    pgLayer,
    CurriculumRepoLive.pipe(Layer.provide(pgLayer)),
    ContentSearchPostgres.pipe(Layer.provide(pgLayer)),
    releaseLayer,
    ConfirmationStoreLive,
    platformLayer,
    spawnerLayer,
  );
};
type Services = Layer.Success<ReturnType<typeof layersFor>>;

const squadId = 'squad-search-1';
const participant: Caller = {principalId: 'participant-1', roomId: squadId, role: 'participant'};
const facilitator: Caller = {principalId: 'facilitator-1', roomId: squadId, role: 'facilitator'};

const ids = {
  courseId: randomUUID(),
  trackId: randomUUID(),
  dayId: randomUUID(),
  lessonA: randomUUID(),
  lessonB: randomUUID(),
  slideA1: randomUUID(),
  slideA2: randomUUID(),
  slideB1: randomUUID(),
  assignmentA: randomUUID(),
  assignmentB: randomUUID(),
};

interface Hit {
  readonly type: string;
  readonly day: number | null;
  readonly lessonId: string | null;
  readonly slideAnchor: string | null;
  readonly title: string;
  readonly snippet: string;
}

describe.skipIf(!enabled)('search_content against a real isolated Postgres', () => {
  let fixture: CurriculumPostgresHandle;
  let scope: Scope.Closeable;
  let context: Context.Context<Services>;

  const run = <A, E>(effect: Effect.Effect<A, E, Services>): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(context)));

  // The full registry's service union includes hosts this suite does not wire;
  // search_content itself needs only ContentSearch + ReleasePolicy, provided above.
  const search = async (caller: Caller, query: string, locale: 'en' | 'nl'): Promise<ReadonlyArray<Hit>> => {
    const result = await run(dispatch(registry, {name: 'search_content', payload: {query, locale}}, caller) as Effect.Effect<unknown, unknown, Services>);
    return (result as {hits: ReadonlyArray<Hit>}).hits;
  };

  beforeAll(async () => {
    if (!dockerAvailable()) throw new Error('ACADEMY_SEARCH_DB_TEST=1 requires a running Docker daemon');
    fixture = await startCurriculumPostgres();
    scope = await Effect.runPromise(Scope.make());
    context = await Effect.runPromise(Layer.buildWithScope(layersFor(fixture.url), scope));
    await run(migrate.run);
    await run(Effect.gen(function* () {
      const sql = yield* PgClient.PgClient;
      yield* sql`insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit)
        values (${ids.courseId}, ${JSON.stringify({en: 'Worldline wave 2'})}::jsonb, 'en', 'https://example.test/repo.git', 'abc123')`;
      const repo = yield* CurriculumRepo;
      yield* repo.publish(ids.courseId, searchCurriculumDraft(ids));
      const releases = yield* ReleaseStore;
      yield* releases.seedSquad(squadId, [
        {lessonId: ids.lessonA, dayOrdinal: 1, lessonOrdinal: 1},
        {lessonId: ids.lessonB, dayOrdinal: 1, lessonOrdinal: 2},
      ]);
    }));
  }, 120_000);

  afterAll(async () => {
    if (scope) await Effect.runPromise(Scope.close(scope, Exit.void));
    if (fixture) stopCurriculumPostgres(fixture);
  }, 30_000);

  test('a term only in speaker notes: 0 hits for a participant, 1 for a facilitator', async () => {
    expect(await search(participant, 'secrets', 'en')).toEqual([]);
    const hits = await search(facilitator, 'secrets', 'en');
    expect(hits.map(({type, day, lessonId, slideAnchor, title}) => ({type, day, lessonId, slideAnchor, title}))).toEqual([
      {type: 'slide', day: 1, lessonId: ids.lessonA, slideAnchor: 'slide-scout-and-plan-1', title: 'Read-only repository scout'},
    ]);
    expect(hits[0]!.snippet).toContain('<mark>secrets</mark>');
  });

  test('a participant snippet never carries notes text, even when the slide matches on public text', async () => {
    const hits = await search(participant, 'scout', 'en');
    expect(hits.find((hit) => hit.slideAnchor === 'slide-scout-and-plan-1')?.snippet).toBeDefined();
    for (const hit of hits) expect(hit.snippet).not.toMatch(/L1-SCOUT|secrets|lesson 03/);
  });

  test('a term in an unreleased lesson: 0 hits for that squad, 1 after release', async () => {
    expect(await search(participant, 'reproducible', 'en')).toEqual([]);
    expect((await search(facilitator, 'reproducible', 'en')).map((hit) => hit.title)).toEqual(['Deliver one reproducible Atlas finding']);

    await run(Effect.gen(function* () {
      const policy = yield* ReleasePolicy;
      yield* policy.releaseLesson(squadId, ids.lessonB, 'facilitator-1');
    }));

    const hits = await search(participant, 'reproducible', 'en');
    expect(hits.map(({type, lessonId, slideAnchor, title}) => ({type, lessonId, slideAnchor, title}))).toEqual([
      {type: 'slide', lessonId: ids.lessonB, slideAnchor: 'slide-atlas-review-1', title: 'Deliver one reproducible Atlas finding'},
    ]);
    expect(await search({...participant, roomId: 'squad-other'}, 'reproducible', 'en')).toEqual([]);
  });

  test('an NL query with a Dutch inflection matches through the dutch config, not the english one', async () => {
    const hits = await search(participant, 'onzekerheden', 'nl');
    expect(hits.map(({type, lessonId, slideAnchor, title}) => ({type, lessonId, slideAnchor, title}))).toEqual([
      {type: 'assignment', lessonId: ids.lessonA, slideAnchor: 'slide-scout-and-plan-2', title: 'Scout-notitie + kleinste plan'},
    ]);
    expect(await search(participant, 'onzekerheden', 'en')).toEqual([]);
  });

  test('assignment hints stay facilitator-only', async () => {
    expect(await search(participant, 'inventing', 'en')).toEqual([]);
    expect((await search(facilitator, 'inventing', 'en')).map((hit) => hit.type)).toEqual(['assignment']);
  });

  test('the glossary is searchable but empty: no importer produces entries yet', async () => {
    const rows = await run(Effect.gen(function* () {
      const sql = yield* PgClient.PgClient;
      return yield* sql<{count: string}>`select count(*)::text as count from academy_curriculum.glossary_terms`;
    }));
    expect(rows).toEqual([{count: '0'}]);
    expect((await search(facilitator, 'glossary', 'en')).filter((hit) => hit.type === 'glossary')).toEqual([]);
  });

  test('stored vectors and GIN indexes exist for both configurations', async () => {
    const rows = await run(Effect.gen(function* () {
      const sql = yield* PgClient.PgClient;
      return yield* sql<{indexname: string}>`select indexname from pg_indexes where schemaname = 'academy_curriculum' and indexdef like '%USING gin%' order by indexname`;
    }));
    expect(rows.map((row) => row.indexname)).toEqual([
      'assignments_private_search_en_idx',
      'assignments_private_search_nl_idx',
      'assignments_search_en_idx',
      'assignments_search_nl_idx',
      'glossary_terms_search_en_idx',
      'glossary_terms_search_nl_idx',
      'slides_private_search_en_idx',
      'slides_private_search_nl_idx',
      'slides_search_en_idx',
      'slides_search_nl_idx',
    ]);
  });
});
