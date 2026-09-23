import {Context, Effect, Layer, Ref} from 'effect';
import {releaseFail, type ReleaseError} from './errors.ts';
import {firstDayOneLessonId, keyOf, type LessonCatalogEntry, type LessonRelease} from './types.ts';

export interface ReleaseStoreShape {
  /** New squad: only the first lesson of day 1 is released; all others locked. */
  readonly seedSquad: (
    squadId: string,
    lessons: ReadonlyArray<LessonCatalogEntry>,
    releasedBy?: string,
    now?: number,
  ) => Effect.Effect<ReadonlyArray<LessonRelease>, ReleaseError>;
  readonly get: (squadId: string, lessonId: string) => Effect.Effect<LessonRelease, ReleaseError>;
  readonly listForSquad: (squadId: string) => Effect.Effect<ReadonlyArray<LessonRelease>>;
  /** Single source of truth for HTTP / MCP / search (plan AE2). */
  readonly isReleased: (squadId: string, lessonId: string) => Effect.Effect<boolean>;
  readonly releaseLesson: (
    squadId: string,
    lessonId: string,
    releasedBy: string,
    now?: number,
  ) => Effect.Effect<LessonRelease, ReleaseError>;
  readonly scheduleLesson: (
    squadId: string,
    lessonId: string,
    scheduledAt: number,
    now?: number,
  ) => Effect.Effect<LessonRelease, ReleaseError>;
  readonly cancelSchedule: (squadId: string, lessonId: string) => Effect.Effect<LessonRelease, ReleaseError>;
  /**
   * Worker entry. Releases only when `scheduleRevision` still matches.
   * Returns null when cancelled, superseded, or already released.
   */
  readonly fireScheduled: (
    squadId: string,
    lessonId: string,
    scheduleRevision: number,
    now?: number,
  ) => Effect.Effect<LessonRelease | null>;
  /**
   * Content publish must not mutate release rows. Exposed for the AC test —
   * implementations are intentionally a no-op against release state.
   */
  readonly noteContentRevisionPublished: (courseId: string, version: number) => Effect.Effect<void>;
}

export class ReleaseStore extends Context.Service<ReleaseStore, ReleaseStoreShape>()('@academy/server/ReleaseStore') {}

const blankRow = (squadId: string, lessonId: string): LessonRelease => ({
  squadId,
  lessonId,
  state: 'locked',
  scheduledAt: null,
  scheduleRevision: null,
  releasedAt: null,
  releasedBy: null,
});

const clone = (row: LessonRelease): LessonRelease => ({...row});

export const ReleaseStoreMemory = (): Layer.Layer<ReleaseStore> =>
  Layer.effect(
    ReleaseStore,
    Effect.gen(function* () {
      const state = yield* Ref.make(new Map<string, LessonRelease>());

      const read = (squadId: string, lessonId: string) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(state);
          const row = map.get(keyOf(squadId, lessonId));
          if (!row) return yield* Effect.fail(releaseFail(404, 'Lesson release not found.'));
          return clone(row);
        });

      const write = (row: LessonRelease) =>
        Ref.update(state, (map) => {
          const next = new Map(map);
          next.set(keyOf(row.squadId, row.lessonId), clone(row));
          return next;
        });

      const shape: ReleaseStoreShape = {
        seedSquad: (squadId, lessons, releasedBy = 'system:seed', now = Date.now()) =>
          Effect.gen(function* () {
            if (lessons.length === 0) {
              return yield* Effect.fail(releaseFail(400, 'Cannot seed release policy without lessons.'));
            }
            const openId = firstDayOneLessonId(lessons);
            if (!openId) {
              return yield* Effect.fail(releaseFail(400, 'Catalog has no day-1 lesson to open by default.'));
            }
            const rows: LessonRelease[] = [];
            for (const lesson of lessons) {
              const released = lesson.lessonId === openId;
              const row: LessonRelease = {
                squadId,
                lessonId: lesson.lessonId,
                state: released ? 'released' : 'locked',
                scheduledAt: null,
                scheduleRevision: null,
                releasedAt: released ? now : null,
                releasedBy: released ? releasedBy : null,
              };
              yield* write(row);
              rows.push(clone(row));
            }
            return rows;
          }),

        get: read,

        listForSquad: (squadId) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(state);
            return [...map.values()].filter((r) => r.squadId === squadId).map(clone);
          }),

        isReleased: (squadId, lessonId) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(state);
            return map.get(keyOf(squadId, lessonId))?.state === 'released';
          }),

        releaseLesson: (squadId, lessonId, releasedBy, now = Date.now()) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(state);
            const existing = map.get(keyOf(squadId, lessonId)) ?? blankRow(squadId, lessonId);
            if (existing.state === 'released') {
              // Idempotent: keep the original releasedBy / releasedAt.
              return clone(existing);
            }
            const row: LessonRelease = {
              ...existing,
              state: 'released',
              scheduledAt: null,
              scheduleRevision: null, // supersedes pending job
              releasedAt: now,
              releasedBy,
            };
            yield* write(row);
            return clone(row);
          }),

        scheduleLesson: (squadId, lessonId, scheduledAt, _now = Date.now()) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(state);
            const existing = map.get(keyOf(squadId, lessonId)) ?? blankRow(squadId, lessonId);
            if (existing.state === 'released') {
              return yield* Effect.fail(releaseFail(409, 'Lesson is already released.'));
            }
            const nextRevision = (existing.scheduleRevision ?? 0) + 1;
            const row: LessonRelease = {
              ...existing,
              state: 'scheduled',
              scheduledAt,
              scheduleRevision: nextRevision,
              releasedAt: null,
              releasedBy: null,
            };
            yield* write(row);
            return clone(row);
          }),

        cancelSchedule: (squadId, lessonId) =>
          Effect.gen(function* () {
            const existing = yield* read(squadId, lessonId);
            if (existing.state !== 'scheduled') {
              return yield* Effect.fail(releaseFail(409, 'Lesson is not scheduled.'));
            }
            const row: LessonRelease = {
              ...existing,
              state: 'locked',
              scheduledAt: null,
              // Bump revision so any in-flight worker job is a no-op.
              scheduleRevision: (existing.scheduleRevision ?? 0) + 1,
              releasedAt: null,
              releasedBy: null,
            };
            yield* write(row);
            return clone(row);
          }),

        fireScheduled: (squadId, lessonId, scheduleRevision, now = Date.now()) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(state);
            const existing = map.get(keyOf(squadId, lessonId));
            if (!existing) return null;
            if (existing.state === 'released') return null;
            if (existing.state !== 'scheduled') return null;
            if (existing.scheduleRevision !== scheduleRevision) return null;
            const row: LessonRelease = {
              ...existing,
              state: 'released',
              scheduledAt: null,
              scheduleRevision: null,
              releasedAt: now,
              releasedBy: 'system:scheduler',
            };
            yield* write(row);
            return clone(row);
          }),

        noteContentRevisionPublished: (_courseId, _version) => Effect.void,
      };

      return shape;
    }),
  );

export const runRelease = <A, E = never>(effect: Effect.Effect<A, E, ReleaseStore>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, ReleaseStoreMemory()));

/** Pure helper for hosts that already hold a row. */
export const isReleasedRecord = (row: LessonRelease | null | undefined): boolean => row?.state === 'released';
