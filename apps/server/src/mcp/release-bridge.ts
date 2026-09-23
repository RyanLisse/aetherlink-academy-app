import {Effect, Layer} from 'effect';
import {ReleasePolicy, type ReleasePolicyShape} from '@academy/actions';
import {ReleasePolicyFromStore} from '../release/policy-layer.ts';
import {ReleaseStore, ReleaseStoreMemory} from '../release/store.ts';

/**
 * Wire MCP/actions ReleasePolicy to AET-28 ReleaseStore.isReleased.
 * Do not edit apps/server/src/release/ — call only.
 */
export {ReleasePolicyFromStore, ReleaseStore, ReleaseStoreMemory};

export const releasePolicyFromIsReleased = (
  isReleased: (squadId: string, lessonId: string) => Effect.Effect<boolean>,
): Layer.Layer<ReleasePolicy> =>
  Layer.succeed(ReleasePolicy, {
    isReleased,
    releaseLesson: (squadId, lessonId, releasedBy) =>
      Effect.succeed({squadId, lessonId, state: 'released' as const, releasedBy, scheduleRevision: null}),
    scheduleLesson: (squadId, lessonId, scheduledAt) =>
      Effect.succeed({squadId, lessonId, state: 'scheduled' as const, scheduledAt, scheduleRevision: 1}),
    cancelSchedule: (squadId, lessonId) =>
      Effect.succeed({squadId, lessonId, state: 'locked' as const, scheduleRevision: 2}),
  } satisfies ReleasePolicyShape);

/** Memory ReleaseStore + ReleasePolicyFromStore for labs/tests. */
export const ReleasePolicyMemory = (): Layer.Layer<ReleasePolicy | ReleaseStore> =>
  ReleasePolicyFromStore.pipe(Layer.provideMerge(ReleaseStoreMemory()));
