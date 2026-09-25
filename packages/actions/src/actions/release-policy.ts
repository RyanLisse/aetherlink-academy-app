import {Context, Effect} from 'effect';

export type ReleaseStateValue = 'locked' | 'scheduled' | 'released';

export interface ReleaseSnapshot {
  readonly squadId: string;
  readonly lessonId: string;
  readonly state: ReleaseStateValue;
  readonly scheduledAt?: number | null;
  readonly scheduleRevision: number | null;
  readonly releasedBy?: string | null;
}

/** Host-provided release policy. Server wires Memory/SQL ReleaseStore behind this. */
export interface ReleasePolicyShape {
  readonly isReleased: (squadId: string, lessonId: string) => Effect.Effect<boolean>;
  readonly releaseLesson: (
    squadId: string,
    lessonId: string,
    releasedBy: string,
  ) => Effect.Effect<ReleaseSnapshot, unknown>;
  readonly scheduleLesson: (
    squadId: string,
    lessonId: string,
    scheduledAt: number,
  ) => Effect.Effect<ReleaseSnapshot, unknown>;
  readonly cancelSchedule: (squadId: string, lessonId: string) => Effect.Effect<ReleaseSnapshot, unknown>;
}

export class ReleasePolicy extends Context.Service<ReleasePolicy, ReleasePolicyShape>()(
  '@academy/actions/ReleasePolicy',
) {}

export const requireSquadRoom = (callerRoomId: string, squadId: string): Effect.Effect<void, Error> =>
  callerRoomId === squadId
    ? Effect.void
    : Effect.fail(new Error(`caller room "${callerRoomId}" does not match squad "${squadId}"`));
