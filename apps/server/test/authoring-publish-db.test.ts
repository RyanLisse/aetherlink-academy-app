import {randomUUID} from 'node:crypto';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {NodeChildProcessSpawner, NodeFileSystem, NodePath} from '@effect/platform-node';
import {PgClient} from '@effect/sql-pg';
import {Context, Effect, Exit, Layer, Redacted, Scope} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import type {SqlError} from 'effect/unstable/sql/SqlError';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {AuthoringLive} from '../src/authoring/index.ts';
import {HOST_KEY_AUTHOR} from '../src/authoring/http.ts';
import {CurriculumRepo, CurriculumRepoLive, type CourseAggregateDraft, type CurriculumRepoShape} from '../src/db/curriculum-repo.ts';
import * as migrate from '../src/db/migrate.ts';
import {FacilitatorAuth, FacilitatorAuthMemory, googleSsoFromEnv, type FacilitatorAuthShape} from '../src/identity/facilitator-auth.ts';
import {SquadStore, SquadStoreMemory} from '../src/squad/store.ts';
import {dockerAvailable, startCurriculumPostgres, stopCurriculumPostgres, type CurriculumPostgresHandle} from './curriculum-docker.ts';

const enabled = process.env.ACADEMY_CURRICULUM_DB_TEST === '1';

const UPSTREAM_ORIGIN = 'https://upstream-slides.invalid';
const API_KEY = 'authoring-db-host-key';
const FACILITATOR_EMAIL = 'facilitator@example.test';

const platformLayer = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
const spawnerLayer = NodeChildProcessSpawner.layer.pipe(Layer.provide(platformLayer));
const layersFor = (url: string) => {
  const pgLayer = PgClient.layer({url: Redacted.make(url), maxConnections: 8, minConnections: 0, connectTimeout: '5 seconds'});
  const repoLayer = CurriculumRepoLive.pipe(Layer.provide(pgLayer));
  return Layer.mergeAll(pgLayer, repoLayer, platformLayer, spawnerLayer);
};

/** Synthetic course: one lesson with one slide, a quiz question and an assignment anchored to the slide. */
const seedDraft = (ids: {lessonId: string; slideId: string}): CourseAggregateDraft => {
  const trackId = randomUUID();
  const dayId = randomUUID();
  return {
    tracks: [{id: trackId, ordinal: 1, name: {en: 'Synthetic track'}}],
    days: [{id: dayId, trackId, ordinal: 1, kind: 'teaching', title: {en: 'Synthetic day'}}],
    lessons: [{id: ids.lessonId, dayId, slug: 'synthetic-lesson', title: {en: 'Synthetic lesson'}, mode: 'guided', durationMinutes: 30}],
    slides: [{id: ids.slideId, lessonId: ids.lessonId, ordinal: 1, title: 'Welcome', type: 'context', notes: 'original notes'}],
    assignments: [{id: randomUUID(), lessonId: ids.lessonId, slideId: ids.slideId, title: {en: 'Synthetic assignment'}, minutes: 10}],
    quizQuestions: [{id: randomUUID(), lessonId: ids.lessonId, question: {en: 'Synthetic?'}, options: [{en: 'Yes'}, {en: 'No'}], answer: 0}],
  };
};

interface DeckSlide {
  id: string;
  content: string;
  notes: string | null;
}

/** Slides upstream test double: create/get-deck over a mutable in-memory deck, standing in for edits made in the Slides editor. */
const installSlidesDouble = (deck: {slides: Array<DeckSlide>}) => {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.startsWith(`${UPSTREAM_ORIGIN}/_agent-native/actions/`)) throw new Error(`unexpected upstream call ${url}`);
    const json = {id: 'deck-synthetic', title: 'Synthetic deck', url: `${UPSTREAM_ORIGIN}/deck-synthetic`, slideCount: deck.slides.length, slides: deck.slides};
    return {status: 200, text: async () => JSON.stringify(json)} as Response;
  }) as typeof fetch;
};

describe.skipIf(!enabled)('AET-25 authoring publish against a real isolated Postgres', () => {
  let fixture: CurriculumPostgresHandle;
  let scope: Scope.Closeable;
  let context: Context.Context<Layer.Success<ReturnType<typeof layersFor>>>;
  let repo: CurriculumRepoShape;
  let facilitators: FacilitatorAuthShape;
  const dataDirs: Array<string> = [];
  const disposers: Array<() => Promise<void>> = [];
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    if (!dockerAvailable()) throw new Error('ACADEMY_CURRICULUM_DB_TEST=1 requires a running Docker daemon');
    fixture = await startCurriculumPostgres();
    scope = await Effect.runPromise(Scope.make());
    context = await Effect.runPromise(Layer.buildWithScope(layersFor(fixture.url), scope));
    const migrated = await Effect.runPromise(migrate.run.pipe(Effect.provide(context), Effect.result));
    if (migrated._tag === 'Failure') throw migrated.failure;
    repo = Context.get(context, CurriculumRepo);
    facilitators = await Effect.runPromise(Effect.gen(function* () {
      return yield* FacilitatorAuth;
    }).pipe(Effect.provide(FacilitatorAuthMemory(googleSsoFromEnv({})))));
  }, 120_000);

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    while (disposers.length) await disposers.pop()!();
    while (dataDirs.length) await rm(dataDirs.pop()!, {recursive: true, force: true});
  });

  afterAll(async () => {
    if (scope) await Effect.runPromise(Scope.close(scope, Exit.void));
    if (fixture) stopCurriculumPostgres(fixture);
  }, 30_000);

  const run = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => Effect.runPromise(effect);
  const sql = <A extends object>(text: string, params: ReadonlyArray<unknown> = []): Promise<ReadonlyArray<A>> =>
    Effect.runPromise(Effect.gen(function* () {
      const client = yield* PgClient.PgClient;
      return yield* client.unsafe<A>(text, params as unknown[]);
    }).pipe(Effect.provide(context)) as Effect.Effect<ReadonlyArray<A>, SqlError, never>);

  const seedCourse = async () => {
    const courseId = randomUUID();
    const lessonId = randomUUID();
    const slideId = randomUUID();
    await sql(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, 'en', 'https://example.test/synthetic.git', 'synthetic')`,
      [courseId, JSON.stringify({en: 'Synthetic course'})],
    );
    const v1 = await run(repo.publish(courseId, seedDraft({lessonId, slideId})));
    expect(v1.version).toBe(1);
    return {courseId, lessonId, slideId};
  };

  const authoringHandler = async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'academy-authoring-db-test-'));
    dataDirs.push(dir);
    const env = {
      ACADEMY_AUTHORING_ENABLED: 'true',
      ACADEMY_AUTHORING_KEY: API_KEY,
      ACADEMY_AUTHORING_DATA_DIR: dir,
      AGENT_SLIDES_URL: UPSTREAM_ORIGIN,
      AGENT_SLIDES_TOKEN: 'upstream-token',
    };
    const web = HttpRouter.toWebHandler(AuthoringLive(env, {curriculum: repo, facilitators}), {disableLogger: true});
    disposers.push(web.dispose);
    return (input: string, init: RequestInit & {auth: string}) =>
      web.handler(new Request(`http://academy.test${input}`, {
        ...init,
        headers: {'content-type': 'application/json', authorization: `Bearer ${init.auth}`},
      }));
  };

  /** Authoring lesson with a deck and one saved snapshot of `deck`'s current slides. */
  const authoredLesson = async (request: Awaited<ReturnType<typeof authoringHandler>>, auth: string) => {
    const created = await request('/authoring-api/lessons', {method: 'POST', auth, body: JSON.stringify({title: 'Synthetic authored lesson', objective: 'Synthetic objective', outline: ['Part one']})});
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    expect((await request(`/authoring-api/lessons/${lesson.id}/deck`, {method: 'POST', auth})).status).toBe(201);
    expect((await request(`/authoring-api/lessons/${lesson.id}/snapshot`, {method: 'POST', auth})).status).toBe(200);
    return lesson.id;
  };

  test('publishing N+1 records author and time, while a room pinned to N keeps rendering N', async () => {
    const {courseId, lessonId} = await seedCourse();
    const roomA = await run(repo.createRoom(courseId));
    expect(roomA.pinnedVersion).toBe(1);

    const deck = {slides: [
      {id: 'slide-1', content: '<div><h1>Welkom terug</h1><p>Vandaag: publiceren</p></div>', notes: 'authored notes'},
      {id: 'slide-2', content: '<div><h2>Tweede slide</h2></div>', notes: null},
    ]};
    installSlidesDouble(deck);
    const sso = await run(facilitators.login({sub: 'synthetic-sub', email: FACILITATOR_EMAIL, name: 'Synthetic Facilitator', domain: 'example.test'}));
    const request = await authoringHandler();
    const authoringLessonId = await authoredLesson(request, sso);

    const before = Date.now();
    const published = await request(`/authoring-api/lessons/${authoringLessonId}/publish`, {method: 'POST', auth: sso, body: JSON.stringify({courseId, curriculumLessonId: lessonId, author: 'spoofed@example.test'})});
    expect(published.status).toBe(201);
    const {publication} = (await published.json()) as {publication: {version: number; baseVersion: number; unchanged: boolean; publishedBy: string; publishedAt: string}};
    expect(publication).toMatchObject({version: 2, baseVersion: 1, unchanged: false, publishedBy: FACILITATOR_EMAIL});
    expect(Date.parse(publication.publishedAt)).toBeGreaterThanOrEqual(before - 1_000);

    const listed = await request(`/authoring-api/courses/${courseId}/revisions`, {method: 'GET', auth: sso});
    expect(listed.status).toBe(200);
    const revisions = (await listed.json()) as {currentVersion: number; revisions: Array<{version: number; status: string; createdBy: string | null; publishedBy: string | null; publishedAt: string | null}>};
    expect(revisions.currentVersion).toBe(2);
    expect(revisions.revisions.map(({version, status, createdBy, publishedBy}) => ({version, status, createdBy, publishedBy}))).toEqual([
      {version: 1, status: 'published', createdBy: null, publishedBy: null},
      {version: 2, status: 'published', createdBy: FACILITATOR_EMAIL, publishedBy: FACILITATOR_EMAIL},
    ]);
    expect(revisions.revisions[1]!.publishedAt).toBe(publication.publishedAt);

    // Room A: pin unchanged in the database, and it still renders v1's content.
    const [roomRow] = await sql<{pinned_version: number}>(`select pinned_version from academy_curriculum.rooms where id = $1`, [roomA.id]);
    expect(roomRow!.pinned_version).toBe(1);
    const roomAView = await run(repo.readLessonParticipant(lessonId, courseId, roomA.pinnedVersion));
    expect(roomAView.slides.map((slide) => slide.title)).toEqual(['Welcome']);

    // A new room pins v2 and renders the authored slides; the quiz carried over; notes stay facilitator-only.
    const roomB = await run(repo.createRoom(courseId));
    expect(roomB.pinnedVersion).toBe(2);
    const roomBView = await run(repo.readLessonParticipant(lessonId, courseId, roomB.pinnedVersion));
    expect(roomBView.slides.map((slide) => slide.title)).toEqual(['Welkom terug', 'Tweede slide']);
    expect(roomBView.quizQuestions).toHaveLength(1);
    expect(roomBView.slides[0]).not.toHaveProperty('notes');
    const facilitatorView = await run(repo.readLessonFacilitator(lessonId, courseId, 2));
    expect(facilitatorView.slides[0]!.notes).toBe('authored notes');

    // Markdown export per revision.
    const v1Markdown = await request(`/authoring-api/courses/${courseId}/revisions/1/lessons/${lessonId}/markdown`, {method: 'GET', auth: sso});
    expect(v1Markdown.headers.get('content-type')).toContain('text/markdown');
    expect(await v1Markdown.text()).toContain('## 1. Welcome\n\n**Facilitatornotities:** original notes');
    const v2Markdown = await (await request(`/authoring-api/courses/${courseId}/revisions/2/lessons/${lessonId}/markdown`, {method: 'GET', auth: sso})).text();
    expect(v2Markdown).toContain('## 1. Welkom terug\n\nVandaag: publiceren\n\n**Facilitatornotities:** authored notes');
    expect(v2Markdown).toContain('## 2. Tweede slide');
    expect(v2Markdown).toContain('- [x] Yes');

    // Re-publishing the same snapshot is a no-op: no new revision.
    const again = await request(`/authoring-api/lessons/${authoringLessonId}/publish`, {method: 'POST', auth: sso, body: JSON.stringify({courseId, curriculumLessonId: lessonId})});
    expect(again.status).toBe(200);
    expect(((await again.json()) as {publication: {unchanged: boolean; version: number}}).publication).toMatchObject({unchanged: true, version: 2});

    // Edit in Slides, snapshot, publish with the host key: v3 by host-key; room A still v1, room B still v2.
    deck.slides[1] = {id: 'slide-2', content: '<div><h2>Tweede slide, bewerkt</h2></div>', notes: null};
    expect((await request(`/authoring-api/lessons/${authoringLessonId}/snapshot`, {method: 'POST', auth: API_KEY})).status).toBe(200);
    const v3 = await request(`/authoring-api/lessons/${authoringLessonId}/publish`, {method: 'POST', auth: API_KEY, body: JSON.stringify({courseId, curriculumLessonId: lessonId})});
    expect(v3.status).toBe(201);
    expect(((await v3.json()) as {publication: {version: number; publishedBy: string}}).publication).toMatchObject({version: 3, publishedBy: HOST_KEY_AUTHOR});
    expect((await run(repo.readLessonParticipant(lessonId, courseId, roomA.pinnedVersion))).slides.map((slide) => slide.title)).toEqual(['Welcome']);
    expect((await run(repo.readLessonParticipant(lessonId, courseId, roomB.pinnedVersion))).slides.map((slide) => slide.title)).toEqual(['Welkom terug', 'Tweede slide']);
    expect((await run(repo.readLessonParticipant(lessonId, courseId, 3))).slides.map((slide) => slide.title)).toEqual(['Welkom terug', 'Tweede slide, bewerkt']);
    const [pins] = await sql<{pins: string}>(`select string_agg(pinned_version::text, ',' order by created_at) as pins from academy_curriculum.rooms where course_id = $1`, [courseId]);
    expect(pins!.pins).toBe('1,2');
  });

  test('participant tokens cannot publish or list revisions, and nothing is written', async () => {
    const {courseId, lessonId} = await seedCourse();
    installSlidesDouble({slides: [{id: 'slide-1', content: '<h1>Nope</h1>', notes: null}]});
    const request = await authoringHandler();
    const authoringLessonId = await authoredLesson(request, API_KEY);
    const participant = await Effect.runPromise(Effect.gen(function* () {
      const squad = yield* SquadStore;
      const room = yield* squad.create('Synthetic squad', {slug: 'synthetic'});
      return (yield* squad.join(room.code, 'Synthetic participant')).token;
    }).pipe(Effect.provide(SquadStoreMemory())));

    const publish = await request(`/authoring-api/lessons/${authoringLessonId}/publish`, {method: 'POST', auth: participant, body: JSON.stringify({courseId, curriculumLessonId: lessonId})});
    expect(publish.status).toBe(401);
    expect((await request(`/authoring-api/courses/${courseId}/revisions`, {method: 'GET', auth: participant})).status).toBe(401);
    expect((await run(repo.listRevisions(courseId))).map((revision) => revision.version)).toEqual([1]);
  });

  test('a snapshot that would drop a slide an assignment is anchored to is refused with 409 and writes nothing', async () => {
    const {courseId, lessonId} = await seedCourse();
    // Two slides in v2 keep ordinal 1's id; shrink to zero-length is impossible, so anchor to a second base slide.
    const base = await run(repo.readAggregate(courseId, 1));
    const secondSlideId = randomUUID();
    const withTwo: CourseAggregateDraft = {
      ...base,
      slides: [...base.slides, {id: secondSlideId, lessonId, ordinal: 2, title: 'Anchored', type: 'practice'}],
      assignments: base.assignments.map((assignment) => ({...assignment, slideId: secondSlideId})),
    };
    expect((await run(repo.publish(courseId, withTwo))).version).toBe(2);

    installSlidesDouble({slides: [{id: 'slide-1', content: '<h1>Only one</h1>', notes: null}]});
    const request = await authoringHandler();
    const authoringLessonId = await authoredLesson(request, API_KEY);
    const refused = await request(`/authoring-api/lessons/${authoringLessonId}/publish`, {method: 'POST', auth: API_KEY, body: JSON.stringify({courseId, curriculumLessonId: lessonId})});
    expect(refused.status).toBe(409);
    expect((await run(repo.listRevisions(courseId))).map((revision) => revision.version)).toEqual([1, 2]);
  });

  test('readAggregate round-trips a revision into a draft writeDraft accepts unchanged', async () => {
    const {courseId} = await seedCourse();
    const base = await run(repo.readAggregate(courseId, 1));
    expect(base.slides).toEqual([expect.objectContaining({title: 'Welcome', notes: 'original notes'})]);
    expect(base.slides[0]).not.toHaveProperty('searchEn');
    expect(base.slides[0]).not.toHaveProperty('kicker');
    const written = await run(repo.writeDraft(courseId, base, 'round-trip', 'synthetic-author'));
    expect(written).toEqual({version: 2, unchanged: false, contentHash: 'round-trip'});
    expect(await run(repo.readAggregate(courseId, 2))).toEqual(base);
    const published = await run(repo.publishDraft(courseId, 2, 'synthetic-author'));
    expect(published.version).toBe(2);
    const republish = await Effect.runPromise(Effect.result(repo.publishDraft(courseId, 2, 'synthetic-author')));
    expect(republish._tag).toBe('Failure');
  });
});
