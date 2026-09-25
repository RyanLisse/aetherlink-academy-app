import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {copyFileSync, mkdtempSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NodeChildProcessSpawner, NodeFileSystem, NodePath} from '@effect/platform-node';
import {PgClient} from '@effect/sql-pg';
import {Context, Effect, Exit, Layer, Redacted, Scope} from 'effect';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {CurriculumRepo, CurriculumRepoLive, type CourseAggregateDraft} from '../src/db/curriculum-repo.ts';
import * as migrate from '../src/db/migrate.ts';
import {dockerAvailable, startCurriculumPostgres, stopCurriculumPostgres, type CurriculumPostgresHandle} from './curriculum-docker.ts';

const enabled = process.env.ACADEMY_CURRICULUM_DB_TEST === '1';
const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, 'fixtures/notion-export-synthetic');
const manualSource = path.resolve(here, '../../../docs/handleiding-facilitator-v2.md');

const seedDraft = (lessonIds: {day1: string; day2a: string; day2b: string}): CourseAggregateDraft => {
  const trackId = randomUUID();
  const dayIds = [1, 2, 3, 4, 5].map(() => randomUUID());
  return {
    tracks: [{id: trackId, ordinal: 1, name: {en: 'Track'}}],
    days: dayIds.map((id, index) => ({id, trackId, ordinal: index + 1, kind: 'teaching' as const, title: {en: `Day ${index + 1}`}})),
    lessons: [
      {id: lessonIds.day1, dayId: dayIds[0]!, slug: 'placeholder-les-1', title: {en: 'L1'}, mode: 'guided', durationMinutes: 30},
      {id: lessonIds.day2a, dayId: dayIds[1]!, slug: 'placeholder-les-2a', title: {en: 'L2a'}, mode: 'guided', durationMinutes: 30},
      {id: lessonIds.day2b, dayId: dayIds[1]!, slug: 'placeholder-les-2b', title: {en: 'L2b'}, mode: 'guided', durationMinutes: 30},
    ],
    slides: [],
    assignments: [],
    quizQuestions: [{id: randomUUID(), lessonId: lessonIds.day1, question: {en: 'Published placeholder?'}, options: [{en: 'A'}, {en: 'B'}], answer: 0}],
  };
};

describe.skipIf(!enabled)('Notion import against a real isolated Postgres', () => {
  let fixtureDb: CurriculumPostgresHandle;
  let scope: Scope.Closeable;
  let context: Context.Context<PgClient.PgClient | CurriculumRepo>;

  const run = <A>(effect: Effect.Effect<A, unknown, PgClient.PgClient | CurriculumRepo>) => Effect.runPromise(effect.pipe(Effect.provide(context)));

  const cli = (...args: string[]) => {
    const result = spawnSync(process.execPath, ['--experimental-strip-types', path.resolve(here, '../scripts/import.ts'), 'notion', fixture, ...args], {
      encoding: 'utf8',
      env: {...process.env, DATABASE_URL: fixtureDb.url},
    });
    expect(result.status, result.stderr).toBe(0);
    return JSON.parse(result.stdout) as {targets: Record<string, {created: number; unchanged: number; skipped: number}>; changes: number; draft: unknown; manual: {changed: boolean}};
  };

  beforeAll(async () => {
    if (!dockerAvailable()) throw new Error('ACADEMY_CURRICULUM_DB_TEST=1 requires a running Docker daemon');
    fixtureDb = await startCurriculumPostgres();
    const platform = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
    const pgLayer = PgClient.layer({url: Redacted.make(fixtureDb.url), maxConnections: 4, minConnections: 0, connectTimeout: '5 seconds'});
    const layer = Layer.mergeAll(pgLayer, CurriculumRepoLive.pipe(Layer.provide(pgLayer)), platform, NodeChildProcessSpawner.layer.pipe(Layer.provide(platform)));
    scope = await Effect.runPromise(Scope.make());
    const built = await Effect.runPromise(Layer.buildWithScope(layer, scope));
    const migrated = await Effect.runPromise(migrate.run.pipe(Effect.provide(built), Effect.result));
    if (migrated._tag === 'Failure') throw migrated.failure;
    context = built;
  }, 120_000);

  afterAll(async () => {
    if (scope) await Effect.runPromise(Scope.close(scope, Exit.void));
    if (fixtureDb) stopCurriculumPostgres(fixtureDb);
  }, 30_000);

  test('dry run counts, real run creates a draft, rerun reports zero changes, and participants never see imported questions', async () => {
    const courseId = randomUUID();
    const lessons = {day1: randomUUID(), day2a: randomUUID(), day2b: randomUUID()};
    await run(Effect.gen(function* () {
      const sql = yield* PgClient.PgClient;
      yield* sql.unsafe(
        'insert into academy_curriculum.courses (id, title, locale, source_git_url, source_commit) values ($1, $2, $3, $4, $5)',
        [courseId, JSON.stringify({en: 'Placeholder course'}), 'nl', 'https://example.test/repo.git', 'placeholder'],
      );
      yield* (yield* CurriculumRepo).publish(courseId, seedDraft(lessons));
    }));
    const manual = path.join(mkdtempSync(path.join(tmpdir(), 'aet33-manual-')), 'handleiding-facilitator-v2.md');
    copyFileSync(manualSource, manual);
    const flags = ['--course', courseId, '--allow-synthetic', '--manual', manual];
    const expectedCreated = {
      'day.schedule': {created: 2, unchanged: 0, skipped: 0},
      'day.checklist': {created: 1, unchanged: 0, skipped: 1},
      quiz_question: {created: 2, unchanged: 0, skipped: 1},
    };

    const dry = cli(...flags, '--dry-run');
    expect(dry.targets).toEqual(expectedCreated);
    expect(dry.draft).toBe('dry-run: nothing written');
    expect(readFileSync(manual, 'utf8')).toBe(readFileSync(manualSource, 'utf8'));
    expect((await run(Effect.gen(function* () {
      return yield* (yield* CurriculumRepo).listRevisions(courseId);
    }))).map((r) => r.version)).toEqual([1]);

    const first = cli(...flags);
    expect(first.targets).toEqual(expectedCreated);
    expect(first.draft).toEqual({version: 2, unchanged: false});
    expect(first.changes).toBe(6);
    expect(readFileSync(manual, 'utf8')).toContain('Bron: [Notion-pagina](https://www.notion.so/00000000000000000000000000000005), opgehaald 2026-01-01T09:00:00.000Z.');

    const second = cli(...flags);
    expect(second.changes).toBe(0);
    expect(second.draft).toBe('no changes: nothing written');
    expect(second.manual.changed).toBe(false);
    expect(second.targets).toEqual({
      'day.schedule': {created: 0, unchanged: 2, skipped: 0},
      'day.checklist': {created: 0, unchanged: 1, skipped: 1},
      quiz_question: {created: 0, unchanged: 2, skipped: 1},
    });

    const state = await run(Effect.gen(function* () {
      const repo = yield* CurriculumRepo;
      const sql = yield* PgClient.PgClient;
      const revisions = yield* repo.listRevisions(courseId);
      const current = yield* repo.currentVersion(courseId);
      const room = yield* repo.createRoom(courseId);
      const pinned = yield* repo.readLessonParticipant(lessons.day1, courseId, room.pinnedVersion);
      const draftAsParticipant = yield* repo.readLessonParticipant(lessons.day1, courseId, 2);
      const draftAsFacilitator = yield* repo.readLessonFacilitator(lessons.day1, courseId, 2);
      const days = yield* sql.unsafe<{ordinal: number; schedule: unknown; checklist: unknown}>(
        'select ordinal, schedule, checklist from academy_curriculum.days where course_id = $1 and version = 2 order by ordinal',
        [courseId],
      );
      return {revisions, current, room, pinned, draftAsParticipant, draftAsFacilitator, days};
    }));

    expect(state.revisions.map(({version, status}) => [version, status])).toEqual([[1, 'published'], [2, 'draft']]);
    expect(state.current).toBe(1);
    expect(state.room.pinnedVersion).toBe(1);
    expect(state.pinned.quizQuestions.map((q) => q.question.en)).toEqual(['Published placeholder?']);
    expect(state.draftAsParticipant).toEqual({slides: [], quizQuestions: []});

    const imported = state.draftAsFacilitator.quizQuestions.filter((q) => q.source !== undefined);
    expect(imported.map((q) => [q.question.nl, q.answer, JSON.parse(q.source!)])).toEqual([
      ['SYNTHETIC vraag 1?', 1, {locator: 'row 1', pageUrl: 'https://www.notion.so/00000000000000000000000000000006', retrievedAt: '2026-01-01T09:00:00.000Z', system: 'notion'}],
    ]);

    const [day1, day2] = state.days as ReadonlyArray<{schedule: Array<{source: {pageUrl: string}}>; checklist: Array<{source: {pageUrl: string}}> | null}>;
    expect(day1?.schedule.map((entry) => entry.source.pageUrl)).toEqual(Array(3).fill('https://www.notion.so/00000000000000000000000000000001'));
    expect(day1?.checklist?.map((item) => item.source.pageUrl)).toEqual(Array(2).fill('https://www.notion.so/00000000000000000000000000000004'));
    expect(day2?.checklist).toBeNull();
  }, 120_000);
});

describe.skipIf(enabled)('notion import db test is opt-in', () => {
  test('skipped unless ACADEMY_CURRICULUM_DB_TEST=1 (needs Docker; see pnpm test:notion-db)', () => {
    expect(enabled).toBe(false);
  });
});
