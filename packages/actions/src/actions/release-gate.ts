import {Effect} from 'effect';
import {ReleasePolicy, type ReleasePolicyShape} from './release-policy.ts';

/**
 * Denial shape must match apps/server/src/release/denial.ts (AET-28).
 * Actions call ReleasePolicy.isReleased — host wires ReleasePolicyFromStore.
 */
export const LOCKED_LESSON_DENIAL = {
  status: 404,
  code: 'lesson_locked',
  message: 'Lesson not found.',
} as const;

export const lockedLessonDenialBody = () => ({
  error: {code: LOCKED_LESSON_DENIAL.code, message: LOCKED_LESSON_DENIAL.message},
});

export class LessonNotReleased extends Error {
  readonly _tag = 'LessonNotReleased' as const;
  readonly status = LOCKED_LESSON_DENIAL.status;
  readonly code = LOCKED_LESSON_DENIAL.code;
  readonly lessonId: string;
  constructor(lessonId: string) {
    super(LOCKED_LESSON_DENIAL.message);
    this.lessonId = lessonId;
  }
  toJSON() {
    return lockedLessonDenialBody();
  }
}

/** KTD6 / AE2 — deny unreleased lessons via ReleasePolicy.isReleased. */
export const requireReleased = (
  policy: ReleasePolicyShape,
  squadId: string,
  lessonId: string,
): Effect.Effect<void, LessonNotReleased> =>
  policy.isReleased(squadId, lessonId).pipe(
    Effect.flatMap((ok) => (ok ? Effect.void : Effect.fail(new LessonNotReleased(lessonId)))),
  );

/** Convenience: yield ReleasePolicy then requireReleased. */
export const requireReleasedEffect = (
  squadId: string,
  lessonId: string,
): Effect.Effect<void, LessonNotReleased, ReleasePolicy> =>
  Effect.gen(function* () {
    const policy = yield* ReleasePolicy;
    yield* requireReleased(policy, squadId, lessonId);
  });
