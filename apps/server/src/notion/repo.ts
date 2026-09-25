import {createHash} from 'node:crypto';
import {PgClient} from '@effect/sql-pg';
import {and, desc, eq, getTableColumns} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {Effect} from 'effect';
import {CourseNotFound, CurriculumRepo, type CourseAggregateDraft} from '../db/curriculum-repo.ts';
import * as schema from '../db/schema.ts';
import type {NotionExport} from './export.ts';
import {canonicalJson, planImport, type ImportPlan} from './plan.ts';

const db = drizzle.mock({schema});

const aggregateTables = {
  tracks: schema.tracks,
  days: schema.days,
  lessons: schema.lessons,
  slides: schema.slides,
  assignments: schema.assignments,
  quizQuestions: schema.quizQuestions,
} as const;

/** Every column except the version stamp, aliased to its JS key (see the `.toSQL()` alias note in db/README.md). */
const draftColumns = (table: (typeof aggregateTables)[keyof typeof aggregateTables]) =>
  Object.fromEntries(
    Object.entries(getTableColumns(table))
      .filter(([key]) => key !== 'courseId' && key !== 'version' && key !== 'createdAt')
      .map(([key, column]) => [key, column.getSQL().as(key)]),
  );

const withoutNulls = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null));

export interface LatestAggregate {
  readonly version: number | null;
  readonly aggregate: CourseAggregateDraft;
}

export const readLatestAggregate = (courseId: string): Effect.Effect<LatestAggregate, unknown, PgClient.PgClient> =>
  Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;
    const run = (query: {sql: string; params: unknown[]}) => sql.unsafe<Record<string, unknown>>(query.sql, query.params);
    const [course] = yield* run(db.select({id: schema.courses.id.getSQL().as('id')}).from(schema.courses).where(eq(schema.courses.id, courseId)).toSQL());
    if (!course) return yield* new CourseNotFound({courseId});
    const [latest] = yield* run(
      db.select({version: schema.courseVersions.version.getSQL().as('version')}).from(schema.courseVersions).where(eq(schema.courseVersions.courseId, courseId)).orderBy(desc(schema.courseVersions.version)).limit(1).toSQL(),
    );
    const version = (latest?.version as number | undefined) ?? null;
    const empty: CourseAggregateDraft = {tracks: [], days: [], lessons: [], slides: [], assignments: [], quizQuestions: []};
    if (version === null) return {version, aggregate: empty};
    const entries = yield* Effect.forEach(Object.entries(aggregateTables), ([key, table]) =>
      run(db.select(draftColumns(table)).from(table).where(and(eq(table.courseId, courseId), eq(table.version, version))).orderBy(table.id).toSQL()).pipe(
        Effect.map((rows) => [key, rows.map(withoutNulls)] as const),
      ),
    );
    return {version, aggregate: Object.fromEntries(entries) as unknown as CourseAggregateDraft};
  });

export interface ImportRun {
  readonly baseVersion: number | null;
  readonly plan: ImportPlan;
  readonly written: {readonly version: number; readonly unchanged: boolean} | null;
}

/**
 * Plan against the latest revision and, unless `dryRun`, write the merged
 * aggregate as a new draft revision. Never publishes; a plan with zero
 * changes writes nothing.
 */
export const importNotionExport = (courseId: string, notion: NotionExport, options: {readonly dryRun: boolean}): Effect.Effect<ImportRun, unknown, PgClient.PgClient | CurriculumRepo> =>
  Effect.gen(function* () {
    const {version, aggregate} = yield* readLatestAggregate(courseId);
    const plan = planImport(courseId, aggregate, notion);
    if (options.dryRun || plan.changes === 0) return {baseVersion: version, plan, written: null};
    const repo = yield* CurriculumRepo;
    const contentHash = `notion:${createHash('sha256').update(canonicalJson(plan.aggregate)).digest('hex')}`;
    const written = yield* repo.writeDraft(courseId, plan.aggregate, contentHash);
    return {baseVersion: version, plan, written: {version: written.version, unchanged: written.unchanged}};
  });
