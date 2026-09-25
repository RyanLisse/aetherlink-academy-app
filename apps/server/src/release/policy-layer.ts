import {Effect, Layer} from 'effect';
import {ReleasePolicy, type ReleasePolicyShape} from '@academy/actions';
import {ReleaseStore} from './store.ts';

/** Adapt server ReleaseStore into the actions-package ReleasePolicy service. */
export const ReleasePolicyFromStore = Layer.effect(
  ReleasePolicy,
  Effect.gen(function* () {
    const store = yield* ReleaseStore;
    const shape: ReleasePolicyShape = {
      isReleased: (squadId, lessonId) => store.isReleased(squadId, lessonId),
      releaseLesson: (squadId, lessonId, releasedBy) =>
        Effect.gen(function* () {
          const row = yield* store.releaseLesson(squadId, lessonId, releasedBy);
          return {
            squadId: row.squadId,
            lessonId: row.lessonId,
            state: row.state,
            releasedBy: row.releasedBy,
            scheduleRevision: row.scheduleRevision,
          };
        }),
      scheduleLesson: (squadId, lessonId, scheduledAt) =>
        Effect.gen(function* () {
          const row = yield* store.scheduleLesson(squadId, lessonId, scheduledAt);
          return {
            squadId: row.squadId,
            lessonId: row.lessonId,
            state: row.state,
            scheduledAt: row.scheduledAt,
            scheduleRevision: row.scheduleRevision,
          };
        }),
      cancelSchedule: (squadId, lessonId) =>
        Effect.gen(function* () {
          const row = yield* store.cancelSchedule(squadId, lessonId);
          return {
            squadId: row.squadId,
            lessonId: row.lessonId,
            state: row.state,
            scheduleRevision: row.scheduleRevision,
          };
        }),
    };
    return shape;
  }),
);
