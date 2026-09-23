import {randomUUID} from 'node:crypto';
import {PgClient} from '@effect/sql-pg';
import type {SqlError} from 'effect/unstable/sql/SqlError';
import {and, desc, eq, sql, type SQLWrapper} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {Context, Data, Effect, Layer} from 'effect';
import {decodeParticipantQuizQuestion, decodeQuizQuestion, decodeSlide, participantSlide, type ParticipantQuizQuestion, type QuizQuestion, type Slide} from '@academy/schema';
import * as schema from './schema.ts';

/** Never given a live connection: every call site ends at `.toSQL()`, never `.execute()`. */
const db = drizzle.mock({schema});

export class CourseNotFound extends Data.TaggedError('CourseNotFound')<{readonly courseId: string}> {}
export class RoomCourseUnpublished extends Data.TaggedError('RoomCourseUnpublished')<{readonly courseId: string}> {}

type DraftRow<Table extends {$inferInsert: object}> = Omit<Table['$inferInsert'], 'courseId' | 'version'> & {readonly id: string};

export interface CourseAggregateDraft {
  readonly tracks: ReadonlyArray<DraftRow<typeof schema.tracks>>;
  readonly days: ReadonlyArray<DraftRow<typeof schema.days>>;
  readonly lessons: ReadonlyArray<DraftRow<typeof schema.lessons>>;
  readonly slides: ReadonlyArray<DraftRow<typeof schema.slides>>;
  readonly assignments: ReadonlyArray<DraftRow<typeof schema.assignments>>;
  readonly quizQuestions: ReadonlyArray<DraftRow<typeof schema.quizQuestions>>;
}

export interface Revision {
  readonly version: number;
  readonly status: 'draft' | 'published';
  readonly contentHash: string | null;
  readonly createdAt: Date;
  readonly publishedAt: Date | null;
}

/**
 * `.toSQL()` never goes through drizzle's own row-mapping (that only happens
 * inside `.execute()`, which this repo never calls), so a plain
 * `{camelCase: table.snake_case_column}` selection compiles to
 * `select "snake_case_column" from ...` with NO alias: `@effect/sql-pg` then
 * hands back a row keyed by the raw Postgres column name, not the JS key.
 * Every projection in this file must alias explicitly with `.as(...)`.
 */
const as = (column: SQLWrapper, name: string) => column.getSQL().as(name);

/** Column allowlist a participant may read: no `notes`, no quiz `answer`. */
const participantSlideColumns = {
  id: as(schema.slides.id, 'id'),
  lessonId: as(schema.slides.lessonId, 'lessonId'),
  ordinal: as(schema.slides.ordinal, 'ordinal'),
  title: as(schema.slides.title, 'title'),
  kicker: as(schema.slides.kicker, 'kicker'),
  subtitle: as(schema.slides.subtitle, 'subtitle'),
  type: as(schema.slides.type, 'type'),
  layout: as(schema.slides.layout, 'layout'),
  cards: as(schema.slides.cards, 'cards'),
  items: as(schema.slides.items, 'items'),
  columns: as(schema.slides.columns, 'columns'),
  steps: as(schema.slides.steps, 'steps'),
  expected: as(schema.slides.expected, 'expected'),
  check: as(schema.slides.check, 'check'),
  timer: as(schema.slides.timer, 'timer'),
  prompt: as(schema.slides.prompt, 'prompt'),
  tagline: as(schema.slides.tagline, 'tagline'),
  dark: as(schema.slides.dark, 'dark'),
  /** Strips only an object-shaped top-level `visual.quiz.answer` in Postgres. */
  visual: sql<unknown>`CASE WHEN jsonb_typeof(${schema.slides.visual}) = 'object' AND jsonb_typeof(${schema.slides.visual}->'quiz') = 'object' THEN ${schema.slides.visual} #- '{quiz,answer}' ELSE ${schema.slides.visual} END`.as('visual'),
  image: as(schema.slides.image, 'image'),
  imageAlt: as(schema.slides.imageAlt, 'imageAlt'),
  imageCaption: as(schema.slides.imageCaption, 'imageCaption'),
  keepCards: as(schema.slides.keepCards, 'keepCards'),
  mascot: as(schema.slides.mascot, 'mascot'),
  concepts: as(schema.slides.concepts, 'concepts'),
  bars: as(schema.slides.bars, 'bars'),
  planB: as(schema.slides.planB, 'planB'),
} as const;

const facilitatorSlideColumns = {
  ...participantSlideColumns,
  visual: as(schema.slides.visual, 'visual'),
  notes: as(schema.slides.notes, 'notes'),
} as const;

const participantQuizColumns = {
  id: as(schema.quizQuestions.id, 'id'),
  lessonId: as(schema.quizQuestions.lessonId, 'lessonId'),
  courseId: as(schema.quizQuestions.courseId, 'courseId'),
  version: as(schema.quizQuestions.version, 'version'),
  question: as(schema.quizQuestions.question, 'question'),
  options: as(schema.quizQuestions.options, 'options'),
  source: as(schema.quizQuestions.source, 'source'),
} as const;

const facilitatorQuizColumns = {...participantQuizColumns, answer: as(schema.quizQuestions.answer, 'answer')} as const;

const nullableSlideFields = ['kicker', 'subtitle', 'layout', 'cards', 'items', 'columns', 'steps', 'expected', 'check', 'timer', 'prompt', 'tagline', 'dark', 'image', 'imageAlt', 'imageCaption', 'keepCards', 'mascot', 'concepts', 'bars', 'planB', 'notes'] as const;

const normalizeSlideRow = (row: Record<string, unknown>): Record<string, unknown> => {
  const normalized = {...row};
  for (const field of nullableSlideFields) if (normalized[field] === null) delete normalized[field];
  return normalized;
};

const normalizeQuizRow = (row: Record<string, unknown>): Record<string, unknown> => {
  const normalized = {...row};
  if (normalized.source === null) delete normalized.source;
  return normalized;
};

export interface CurriculumRepoShape {
  readonly currentVersion: (courseId: string) => Effect.Effect<number | null, SqlError | CourseNotFound>;
  readonly listRevisions: (courseId: string) => Effect.Effect<ReadonlyArray<Revision>, SqlError>;
  readonly writeDraft: (courseId: string, draft: CourseAggregateDraft, contentHash: string) => Effect.Effect<{readonly version: number; readonly unchanged: boolean; readonly contentHash: string}, SqlError | CourseNotFound>;
  readonly publish: (courseId: string, draft: CourseAggregateDraft) => Effect.Effect<{readonly version: number}, SqlError | CourseNotFound>;
  readonly createRoom: (courseId: string) => Effect.Effect<{readonly id: string; readonly pinnedVersion: number}, SqlError | CourseNotFound | RoomCourseUnpublished>;
  readonly readLessonFacilitator: (lessonId: string, courseId: string, version: number) => Effect.Effect<{
    readonly slides: ReadonlyArray<Slide>;
    readonly quizQuestions: ReadonlyArray<QuizQuestion>;
  }, SqlError>;
  readonly readLessonParticipant: (lessonId: string, courseId: string, version: number) => Effect.Effect<{
    readonly slides: ReadonlyArray<ReturnType<typeof participantSlide>>;
    readonly quizQuestions: ReadonlyArray<ParticipantQuizQuestion>;
  }, SqlError>;
}

export class CurriculumRepo extends Context.Service<CurriculumRepo, CurriculumRepoShape>()('@academy/server/CurriculumRepo') {}

const run = <A extends object>(sqlClient: PgClient.PgClient, query: {sql: string; params: unknown[]}) => sqlClient.unsafe<A>(query.sql, query.params);

const stampVersion = <Row extends {id: string}>(rows: ReadonlyArray<Row>, courseId: string, version: number) =>
  rows.map((row) => ({...row, id: row.id, courseId, version}));

export const CurriculumRepoLive: Layer.Layer<CurriculumRepo, never, PgClient.PgClient> = Layer.effect(
  CurriculumRepo,
  Effect.gen(function* () {
    const sqlClient = yield* PgClient.PgClient;

    const currentVersion: CurriculumRepoShape['currentVersion'] = (courseId) =>
      Effect.gen(function* () {
        const query = db.select({currentVersion: as(schema.courses.currentVersion, 'currentVersion')}).from(schema.courses).where(eq(schema.courses.id, courseId)).toSQL();
        const rows = yield* run<{currentVersion: number | null}>(sqlClient, query);
        const [row] = rows;
        if (!row) return yield* new CourseNotFound({courseId});
        return row.currentVersion;
      });

    const listRevisions: CurriculumRepoShape['listRevisions'] = (courseId) =>
      Effect.gen(function* () {
        const query = db
          .select({
            version: as(schema.courseVersions.version, 'version'),
            status: as(schema.courseVersions.status, 'status'),
            contentHash: as(schema.courseVersions.contentHash, 'contentHash'),
            createdAt: as(schema.courseVersions.createdAt, 'createdAt'),
            publishedAt: as(schema.courseVersions.publishedAt, 'publishedAt'),
          })
          .from(schema.courseVersions)
          .where(eq(schema.courseVersions.courseId, courseId))
          .orderBy(schema.courseVersions.version)
          .toSQL();
        return yield* run<Revision>(sqlClient, query);
      });

    const writeDraft: CurriculumRepoShape['writeDraft'] = (courseId, draft, contentHash) =>
      sqlClient.withTransaction(
        Effect.gen(function* () {
          const lockQuery = db.select({id: as(schema.courses.id, 'id')}).from(schema.courses).where(eq(schema.courses.id, courseId)).for('update').toSQL();
          const locked = yield* run<{id: string}>(sqlClient, lockQuery);
          if (locked.length === 0) return yield* new CourseNotFound({courseId});

          const latestQuery = db
            .select({
              version: as(schema.courseVersions.version, 'version'),
              contentHash: as(schema.courseVersions.contentHash, 'contentHash'),
              status: as(schema.courseVersions.status, 'status'),
            })
            .from(schema.courseVersions)
            .where(eq(schema.courseVersions.courseId, courseId))
            .orderBy(desc(schema.courseVersions.version))
            .toSQL();
          const [latest] = yield* run<{version: number; contentHash: string | null; status: string}>(sqlClient, latestQuery);
          if (latest && latest.contentHash === contentHash && latest.status === 'draft') {
            return {version: latest.version, unchanged: true, contentHash};
          }

          const nextVersionQuery = db
            .select({next: sql<number>`coalesce(max(${schema.courseVersions.version}), 0) + 1`.as('next')})
            .from(schema.courseVersions)
            .where(eq(schema.courseVersions.courseId, courseId))
            .toSQL();
          const [nextRow] = yield* run<{next: number}>(sqlClient, nextVersionQuery);
          const version = nextRow?.next ?? 1;

          const insertVersion = db.insert(schema.courseVersions).values({courseId, version, status: 'draft', contentHash}).toSQL();
          yield* run(sqlClient, insertVersion);

          for (const rows of [
            {table: schema.tracks, values: draft.tracks},
            {table: schema.days, values: draft.days},
            {table: schema.lessons, values: draft.lessons},
            {table: schema.slides, values: draft.slides},
            {table: schema.assignments, values: draft.assignments},
            {table: schema.quizQuestions, values: draft.quizQuestions},
          ] as const) {
            if (rows.values.length === 0) continue;
            const stamped = stampVersion(rows.values as ReadonlyArray<{id: string}>, courseId, version);
            const insert = db.insert(rows.table).values(stamped as never).toSQL();
            yield* run(sqlClient, insert);
          }

          // Never publishes: currentVersion pointer stays untouched.
          return {version, unchanged: false, contentHash};
        }),
      );

    const publish: CurriculumRepoShape['publish'] = (courseId, draft) =>
      sqlClient.withTransaction(
        Effect.gen(function* () {
          const lockQuery = db.select({id: as(schema.courses.id, 'id')}).from(schema.courses).where(eq(schema.courses.id, courseId)).for('update').toSQL();
          const locked = yield* run<{id: string}>(sqlClient, lockQuery);
          if (locked.length === 0) return yield* new CourseNotFound({courseId});

          const nextVersionQuery = db
            .select({next: sql<number>`coalesce(max(${schema.courseVersions.version}), 0) + 1`.as('next')})
            .from(schema.courseVersions)
            .where(eq(schema.courseVersions.courseId, courseId))
            .toSQL();
          const [nextRow] = yield* run<{next: number}>(sqlClient, nextVersionQuery);
          const version = nextRow?.next ?? 1;

          const insertVersion = db.insert(schema.courseVersions).values({courseId, version, status: 'draft'}).toSQL();
          yield* run(sqlClient, insertVersion);

          for (const rows of [
            {table: schema.tracks, values: draft.tracks},
            {table: schema.days, values: draft.days},
            {table: schema.lessons, values: draft.lessons},
            {table: schema.slides, values: draft.slides},
            {table: schema.assignments, values: draft.assignments},
            {table: schema.quizQuestions, values: draft.quizQuestions},
          ] as const) {
            if (rows.values.length === 0) continue;
            const stamped = stampVersion(rows.values as ReadonlyArray<{id: string}>, courseId, version);
            const insert = db.insert(rows.table).values(stamped as never).toSQL();
            yield* run(sqlClient, insert);
          }

          const publishVersion = db
            .update(schema.courseVersions)
            .set({status: 'published', publishedAt: new Date()})
            .where(and(eq(schema.courseVersions.courseId, courseId), eq(schema.courseVersions.version, version)))
            .toSQL();
          yield* run(sqlClient, publishVersion);

          const movePointer = db.update(schema.courses).set({currentVersion: version}).where(eq(schema.courses.id, courseId)).toSQL();
          yield* run(sqlClient, movePointer);

          return {version};
        }),
      );

    const createRoom: CurriculumRepoShape['createRoom'] = (courseId) =>
      sqlClient.withTransaction(
        Effect.gen(function* () {
          const query = db
            .select({currentVersion: as(schema.courses.currentVersion, 'currentVersion')})
            .from(schema.courses)
            .where(eq(schema.courses.id, courseId))
            .for('share')
            .toSQL();
          const [row] = yield* run<{currentVersion: number | null}>(sqlClient, query);
          if (!row) return yield* new CourseNotFound({courseId});
          if (row.currentVersion === null) return yield* new RoomCourseUnpublished({courseId});

          const id = randomUUID();
          const insert = db.insert(schema.rooms).values({id, courseId, pinnedVersion: row.currentVersion}).toSQL();
          yield* run(sqlClient, insert);
          return {id, pinnedVersion: row.currentVersion};
        }),
      );

    const readLessonFacilitator: CurriculumRepoShape['readLessonFacilitator'] = (lessonId, courseId, version) =>
      Effect.gen(function* () {
        const slidesQuery = db
          .select(facilitatorSlideColumns)
          .from(schema.slides)
          .where(and(eq(schema.slides.lessonId, lessonId), eq(schema.slides.courseId, courseId), eq(schema.slides.version, version)))
          .orderBy(schema.slides.ordinal)
          .toSQL();
        const quizQuery = db
          .select(facilitatorQuizColumns)
          .from(schema.quizQuestions)
          .where(and(eq(schema.quizQuestions.lessonId, lessonId), eq(schema.quizQuestions.courseId, courseId), eq(schema.quizQuestions.version, version)))
          .toSQL();
        const slides = (yield* run<Record<string, unknown>>(sqlClient, slidesQuery)).map((row) => decodeSlide(normalizeSlideRow(row)));
        const quizQuestions = (yield* run<Record<string, unknown>>(sqlClient, quizQuery)).map((row) => decodeQuizQuestion(normalizeQuizRow(row)));
        return {slides, quizQuestions};
      });

    const readLessonParticipant: CurriculumRepoShape['readLessonParticipant'] = (lessonId, courseId, version) =>
      Effect.gen(function* () {
        const slidesQuery = db
          .select(participantSlideColumns)
          .from(schema.slides)
          .where(and(eq(schema.slides.lessonId, lessonId), eq(schema.slides.courseId, courseId), eq(schema.slides.version, version)))
          .orderBy(schema.slides.ordinal)
          .toSQL();
        const quizQuery = db
          .select(participantQuizColumns)
          .from(schema.quizQuestions)
          .where(and(eq(schema.quizQuestions.lessonId, lessonId), eq(schema.quizQuestions.courseId, courseId), eq(schema.quizQuestions.version, version)))
          .toSQL();
        const slides = (yield* run<Record<string, unknown>>(sqlClient, slidesQuery)).map((row) => participantSlide(decodeSlide(normalizeSlideRow(row))));
        const quizQuestions = (yield* run<Record<string, unknown>>(sqlClient, quizQuery)).map((row) => decodeParticipantQuizQuestion(normalizeQuizRow(row)));
        return {slides, quizQuestions};
      });

    return {currentVersion, listRevisions, writeDraft, publish, createRoom, readLessonFacilitator, readLessonParticipant};
  }),
);
