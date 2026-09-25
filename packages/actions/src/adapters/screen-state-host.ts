import {Effect, Layer} from 'effect';
import type {Caller} from '../caller.ts';
import {ConfirmationStoreLive} from '../confirmation.ts';
import {dispatchDecoded} from '../dispatcher.ts';
import {getParticipantScreenState} from '../actions/get-participant-screen-state.ts';
import {ParticipantContext, type ParticipantViewBinding} from '../actions/participant-context.ts';
import {ReleasePolicy} from '../actions/release-policy.ts';

export interface ScreenStateHost {
  readonly listActive: (roomId: string, participantId: string) => Promise<ReadonlyArray<ParticipantViewBinding>>;
  readonly isReleased: (squadId: string, lessonId: string) => Promise<boolean>;
}

export type ScreenState = (typeof getParticipantScreenState.output)['Encoded'];

const unsupported = () => Effect.fail(new Error('Release writes are not available on this host.'));

/**
 * Promise-facing entry for hosts that are not Effect programs (the legacy
 * Express gateway). Release lookups that reject count as locked so a broken
 * release source never widens what the caller sees.
 */
export const runParticipantScreenState = (caller: Caller, host: ScreenStateHost): Promise<ScreenState> =>
  dispatchDecoded(getParticipantScreenState, {}, caller, undefined).pipe(
    Effect.provide(
      Layer.mergeAll(
        ConfirmationStoreLive,
        Layer.succeed(ParticipantContext, {
          upsert: () => Effect.die(new Error('Screen state is written by the host, not by this adapter.')),
          listActive: (roomId, participantId) => Effect.promise(() => host.listActive(roomId, participantId)),
          clear: () => Effect.void,
        }),
        Layer.succeed(ReleasePolicy, {
          isReleased: (squadId, lessonId) =>
            Effect.tryPromise(() => host.isReleased(squadId, lessonId)).pipe(
              Effect.map((released) => released === true),
              Effect.orElseSucceed(() => false),
            ),
          releaseLesson: unsupported,
          scheduleLesson: unsupported,
          cancelSchedule: unsupported,
        }),
      ),
    ),
    Effect.mapError((error) => {
      const cause = error._tag === 'ActionRunFailed' ? error.cause : error;
      const message = cause instanceof Error ? cause.message : String(cause);
      const status = typeof (cause as {status?: unknown}).status === 'number' ? (cause as {status: number}).status : 409;
      return Object.assign(new Error(message), {status});
    }),
    Effect.runPromise,
  );
