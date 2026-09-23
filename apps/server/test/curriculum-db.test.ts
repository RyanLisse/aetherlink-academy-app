import {randomUUID} from 'node:crypto';
import {NodeChildProcessSpawner, NodeFileSystem, NodePath} from '@effect/platform-node';
import {PgClient} from '@effect/sql-pg';
import {decodeParticipantQuizQuestion, decodeQuizQuestion, decodeSlide, participantSlide} from '@academy/schema';
import {Context, Effect, Exit, Layer, Redacted, Scope} from 'effect';
import type {SqlError} from 'effect/unstable/sql/SqlError';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {CourseAggregateDraft} from '../src/db/curriculum-repo.ts';
import {CourseNotFound, CurriculumRepo, CurriculumRepoLive, RoomCourseUnpublished} from '../src/db/curriculum-repo.ts';
import * as migrate from '../src/db/migrate.ts';
import {docker, dockerAvailable, startCurriculumPostgres, stopCurriculumPostgres, type CurriculumPostgresHandle} from './curriculum-docker.ts';

const enabled = process.env.ACADEMY_CURRICULUM_DB_TEST === '1';

const platformLayer = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
const spawnerLayer = NodeChildProcessSpawner.layer.pipe(Layer.provide(platformLayer));
const layersFor = (url: string) => {
  const pgLayer = PgClient.layer({
    url: Redacted.make(url),
    maxConnections: 8,
    minConnections: 0,
    connectTimeout: '5 seconds',
  });
  const repoLayer = CurriculumRepoLive.pipe(Layer.provide(pgLayer));
  const fullLayer = Layer.mergeAll(pgLayer, repoLayer, platformLayer, spawnerLayer);
  return {fullLayer};
};
type TestLayers = ReturnType<typeof layersFor>;

const course = () => ({
  id: randomUUID(),
  title: {en: 'Effect Foundations'},
  locale: 'en' as const,
  sourceGitUrl: 'https://example.test/repo.git',
  sourceCommit: 'abc123',
});

const draftFor = (courseId: string, lessonId: string, slideId: string, quizId: string, visual: unknown = {quiz: {answer: 2, prompt: 'keep'}, art: {quiz: {answer: 'display label'}}, bot: 'wave'}): CourseAggregateDraft => {
  const trackId = randomUUID();
  const dayId = randomUUID();
  return {
    tracks: [{id: trackId, ordinal: 1, name: {en: 'Core'}}],
    days: [{id: dayId, trackId, ordinal: 1, kind: 'teaching', title: {en: 'Day 1'}}],
    lessons: [{id: lessonId, dayId, slug: 'intro', title: {en: 'Intro'}, mode: 'guided', durationMinutes: 45}],
    slides: [
      {
        id: slideId,
        lessonId,
        ordinal: 1,
        title: 'Welcome',
        type: 'context',
        notes: 'speaker notes',
        visual,
      },
    ],
    assignments: [],
    quizQuestions: [{id: quizId, lessonId, question: {en: 'What is Effect?'}, options: [{en: 'A runtime'}, {en: 'A framework'}], answer: 0}],
  };
};

describe.skipIf(!enabled)('CurriculumRepo against a real isolated Postgres', () => {
  let fixture: CurriculumPostgresHandle;
  let scope: Scope.Closeable;
  let fullLayer: TestLayers['fullLayer'];
  let context: Context.Context<Layer.Success<TestLayers['fullLayer']>>;

  beforeAll(async () => {
    if (!dockerAvailable()) throw new Error('ACADEMY_CURRICULUM_DB_TEST=1 requires a running Docker daemon');
    fixture = await startCurriculumPostgres();
    fullLayer = layersFor(fixture.url).fullLayer;
    scope = await Effect.runPromise(Scope.make());
    context = await Effect.runPromise(Layer.buildWithScope(fullLayer, scope));
    const migrated = await Effect.runPromise(migrate.run.pipe(Effect.provide(context), Effect.result));
    if (migrated._tag === 'Failure') throw migrated.failure;
  }, 120_000);

  afterAll(async () => {
    if (scope) await Effect.runPromise(Scope.close(scope, Exit.void));
    if (fixture) stopCurriculumPostgres(fixture);
  }, 30_000);

  const run = <A, E>(effect: Effect.Effect<A, E, Layer.Success<TestLayers['fullLayer']>>): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(context)));

  const sqlUnsafe = <A extends object>(text: string, params: ReadonlyArray<unknown> = []): Promise<ReadonlyArray<A>> =>
    run(Effect.gen(function* () {
      const sql = yield* PgClient.PgClient;
      return yield* sql.unsafe<A>(text, params as unknown[]);
    }) as Effect.Effect<ReadonlyArray<A>, SqlError, PgClient.PgClient>);

  test('migrations are idempotent against the same database', async () => {
    const second = await run(migrate.run);
    expect(second).toEqual([]);
  });

  test('concurrent curriculum fixtures use distinct loopback ports and exact-owner cleanup', async () => {
    const second = await startCurriculumPostgres();
    try {
      expect(second.name).not.toBe(fixture.name);
      expect(second.owner).not.toBe(fixture.owner);
      expect(second.port).not.toBe(fixture.port);
      expect(docker('inspect', '--format', '{{.Name}}', fixture.name)).toBe(`/${fixture.name}`);
    } finally {
      stopCurriculumPostgres(second);
    }
    expect(() => docker('inspect', second.name)).toThrow();
    expect(docker('inspect', '--format', '{{.Name}}', fixture.name)).toBe(`/${fixture.name}`);
  });

  test('publishing v1 then v2 leaves a room pinned to v1 unchanged, while a fresh room reads v2, and stable ids repeat across versions', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );

    const lessonId = randomUUID();
    const slideId = randomUUID();
    const quizId = randomUUID();

    const v1 = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.publish(c.id, draftFor(c.id, lessonId, slideId, quizId));
    }));
    expect(v1.version).toBe(1);

    const roomA = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.createRoom(c.id);
    }));
    expect(roomA.pinnedVersion).toBe(1);

    const v1Draft = draftFor(c.id, lessonId, slideId, quizId);
    const v2Draft: CourseAggregateDraft = {...v1Draft, slides: [{...v1Draft.slides[0]!, title: 'Welcome (edited)'}]};
    const v2 = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.publish(c.id, v2Draft);
    }));
    expect(v2.version).toBe(2);

    const roomAAgain = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.readLessonFacilitator(lessonId, c.id, roomA.pinnedVersion);
    }));
    expect(roomAAgain.slides[0]?.title).toBe('Welcome');

    const roomB = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.createRoom(c.id);
    }));
    expect(roomB.pinnedVersion).toBe(2);
    const roomBRead = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.readLessonFacilitator(lessonId, c.id, roomB.pinnedVersion);
    }));
    expect(roomBRead.slides[0]?.title).toBe('Welcome (edited)');

    const revisions = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.listRevisions(c.id);
    }));
    expect(revisions.map((r) => r.version)).toEqual([1, 2]);
    expect(revisions.every((r) => r.status === 'published')).toBe(true);
  });

  test('participant projection excludes notes and the quiz answer, including the nested visual.quiz.answer, but keeps unrelated nested data', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const lessonId = randomUUID();
    const slideId = randomUUID();
    const quizId = randomUUID();
    await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      yield* repository.publish(c.id, draftFor(c.id, lessonId, slideId, quizId));
    }));

    const facilitator = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.readLessonFacilitator(lessonId, c.id, 1);
    }));
    const participant = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.readLessonParticipant(lessonId, c.id, 1);
    }));

    expect(decodeSlide(facilitator.slides[0])).toHaveProperty('notes', 'speaker notes');
    expect(decodeQuizQuestion(facilitator.quizQuestions[0])).toHaveProperty('answer', 0);
    expect(facilitator.slides[0]?.visual).toEqual({quiz: {answer: 2, prompt: 'keep'}, art: {quiz: {answer: 'display label'}}, bot: 'wave'});

    expect(participantSlide(decodeSlide(participant.slides[0]))).not.toHaveProperty('notes');
    expect(Object.keys(participant.quizQuestions[0] as object)).not.toContain('answer');
    expect(decodeParticipantQuizQuestion(participant.quizQuestions[0])).not.toHaveProperty('answer');
    expect(participant.slides[0]?.visual).toEqual({quiz: {prompt: 'keep'}, art: {quiz: {answer: 'display label'}}, bot: 'wave'});
  });

  test('participant visual projection preserves scalar, null, array, quiz-array, and unrelated nested JSON shapes', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const lessonId = randomUUID();
    const base = draftFor(c.id, lessonId, randomUUID(), randomUUID());
    const visuals: readonly unknown[] = [
      'visible scalar',
      null,
      [{quiz: {answer: 1}}],
      {quiz: [{answer: 2}]},
      {nested: {answer: 3}},
      {quiz: {answer: 4, prompt: 'keep'}, nested: {answer: 5}},
    ];
    const slides = visuals.map((visual, index) => ({...base.slides[0]!, id: randomUUID(), ordinal: index + 1, visual}));
    await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      yield* repository.publish(c.id, {...base, slides});
    }));

    const participant = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.readLessonParticipant(lessonId, c.id, 1);
    }));
    expect(participant.slides.map((slide) => slide.visual)).toEqual([
      'visible scalar',
      null,
      [{quiz: {answer: 1}}],
      {quiz: [{answer: 2}]},
      {nested: {answer: 3}},
      {quiz: {prompt: 'keep'}, nested: {answer: 5}},
    ]);
  });

  test('publishing serializes per course under concurrency and never assigns a duplicate version', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const makeDraft = () => draftFor(c.id, randomUUID(), randomUUID(), randomUUID());
    const [a, b] = await Promise.all([
      run(Effect.gen(function* () {
        const repository = yield* CurriculumRepo;
        return yield* repository.publish(c.id, makeDraft());
      })),
      run(Effect.gen(function* () {
        const repository = yield* CurriculumRepo;
        return yield* repository.publish(c.id, makeDraft());
      })),
    ]);
    expect(new Set([a.version, b.version])).toEqual(new Set([1, 2]));
    const revisions = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.listRevisions(c.id);
    }));
    expect(revisions.map((r) => r.version)).toEqual([1, 2]);
  });

  test('a failed publish rolls back completely and leaves the pointer and revisions unchanged', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const lessonId = randomUUID();
    const slideId = randomUUID();
    const quizId = randomUUID();
    await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      yield* repository.publish(c.id, draftFor(c.id, lessonId, slideId, quizId));
    }));

    const before = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.currentVersion(c.id);
    }));
    expect(before).toBe(1);

    const broken: CourseAggregateDraft = {...draftFor(c.id, lessonId, randomUUID(), randomUUID()), slides: [{...draftFor(c.id, lessonId, randomUUID(), randomUUID()).slides[0]!, lessonId: randomUUID()}]};
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* CurriculumRepo;
        return yield* repository.publish(c.id, broken);
      }).pipe(Effect.provide(context), Effect.result),
    );
    expect(result._tag).toBe('Failure');

    const after = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.currentVersion(c.id);
    }));
    expect(after).toBe(1);
    const revisions = await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      return yield* repository.listRevisions(c.id);
    }));
    expect(revisions.map((r) => r.version)).toEqual([1]);
  });

  test('duplicate revision numbers are rejected by the unique course/version constraint', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    await sqlUnsafe(`insert into academy_curriculum.course_versions (course_id, version, status) values ($1, 1, 'published')`, [c.id]);
    await expect(sqlUnsafe(`insert into academy_curriculum.course_versions (course_id, version, status) values ($1, 1, 'draft')`, [c.id])).rejects.toBeTruthy();
  });

  test('database triggers reject writes into an already-published revision, including the transition itself', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const lessonId = randomUUID();
    const slideId = randomUUID();
    const quizId = randomUUID();
    await run(Effect.gen(function* () {
      const repository = yield* CurriculumRepo;
      yield* repository.publish(c.id, draftFor(c.id, lessonId, slideId, quizId));
    }));

    await expect(sqlUnsafe(`update academy_curriculum.slides set title = 'hacked' where id = $1`, [slideId])).rejects.toBeTruthy();
    await expect(sqlUnsafe(`delete from academy_curriculum.slides where id = $1`, [slideId])).rejects.toBeTruthy();
    await expect(
      sqlUnsafe(
        `insert into academy_curriculum.slides (id, lesson_id, course_id, version, ordinal, title, type) values ($1, $2, $3, 1, 2, 'sneaky', 'context')`,
        [randomUUID(), lessonId, c.id],
      ),
    ).rejects.toBeTruthy();
    await expect(sqlUnsafe(`update academy_curriculum.course_versions set status = 'draft' where course_id = $1 and version = 1`, [c.id])).rejects.toBeTruthy();
  });

  test('a room cannot pin an unpublished revision and cannot be mutated once created', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    await sqlUnsafe(`insert into academy_curriculum.course_versions (course_id, version, status) values ($1, 1, 'draft')`, [c.id]);
    await expect(sqlUnsafe(`insert into academy_curriculum.rooms (id, course_id, pinned_version) values ($1, $2, 1)`, [randomUUID(), c.id])).rejects.toBeTruthy();

    await sqlUnsafe(`update academy_curriculum.course_versions set status = 'published', published_at = now() where course_id = $1 and version = 1`, [c.id]);
    const roomId = randomUUID();
    await sqlUnsafe(`insert into academy_curriculum.rooms (id, course_id, pinned_version) values ($1, $2, 1)`, [roomId, c.id]);
    await expect(sqlUnsafe(`update academy_curriculum.rooms set pinned_version = 1 where id = $1`, [roomId])).rejects.toBeTruthy();
  });

  test('createRoom fails against a course that has never published', async () => {
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* CurriculumRepo;
        return yield* repository.createRoom(c.id);
      }).pipe(Effect.provide(context), Effect.result),
    );
    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') expect(result.failure).toBeInstanceOf(RoomCourseUnpublished);
  });

  test('reading an unknown course fails with CourseNotFound', async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* CurriculumRepo;
        return yield* repository.currentVersion(randomUUID());
      }).pipe(Effect.provide(context), Effect.result),
    );
    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') expect(result.failure).toBeInstanceOf(CourseNotFound);
  });

  test('writeDraft is idempotent on content hash and never publishes', async () => {
    const {slidesToAggregate} = await import('../src/importers/slidesAggregate.ts');
    const {contentHashSlides} = await import('../src/importers/contentHash.ts');
    const {decodeSlide} = await import('@academy/schema');
    const c = course();
    await sqlUnsafe(
      `insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)`,
      [c.id, JSON.stringify(c.title), c.locale, c.sourceGitUrl, c.sourceCommit],
    );
    const lessonId = 'imported-lesson';
    const slides = [
      decodeSlide({id: 's1', lessonId, ordinal: 1, title: 'One', type: 'context'}),
      decodeSlide({id: 's2', lessonId, ordinal: 2, title: 'Two', type: 'concept', layout: 'cards', cards: [{title: 'A', body: 'B'}]}),
    ];
    const hash = contentHashSlides(slides);
    const draft = slidesToAggregate(c.id, slides);
    const first = await run(Effect.gen(function* () {
      const repo = yield* CurriculumRepo;
      return yield* repo.writeDraft(c.id, draft, hash);
    }));
    expect(first.unchanged).toBe(false);
    expect(first.version).toBe(1);
    const second = await run(Effect.gen(function* () {
      const repo = yield* CurriculumRepo;
      return yield* repo.writeDraft(c.id, draft, hash);
    }));
    expect(second.unchanged).toBe(true);
    expect(second.version).toBe(1);
    const revisions = await run(Effect.gen(function* () {
      const repo = yield* CurriculumRepo;
      return yield* repo.listRevisions(c.id);
    }));
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.status).toBe('draft');
    expect(revisions[0]?.contentHash).toBe(hash);
    const current = await run(Effect.gen(function* () {
      const repo = yield* CurriculumRepo;
      return yield* repo.currentVersion(c.id);
    }));
    expect(current).toBeNull();
  });

});

describe.skipIf(enabled)('curriculum db test is opt-in', () => {
  test('skipped unless ACADEMY_CURRICULUM_DB_TEST=1 (needs Docker; see pnpm test:curriculum-db)', () => {
    expect(enabled).toBe(false);
  });
});
