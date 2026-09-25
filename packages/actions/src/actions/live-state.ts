import {Context, Effect} from 'effect';

/** Host-provided live classroom cursor. Server wires Redis/memory implementation. */
export interface LivePresenterShape {
  readonly roomId: string;
  readonly get: Effect.Effect<{
    readonly lesson: string | null;
    readonly slideIndex: number;
    readonly revealStep: number;
    readonly timerStartedAt: string | null;
    readonly timerMinutes: number | null;
    readonly planB: boolean;
    readonly pauseUntil: string | null;
    readonly revision: number | null;
  }>;
  readonly nextSlide: Effect.Effect<{readonly slideIndex: number; readonly revealStep: number}>;
  readonly prevSlide: Effect.Effect<{readonly slideIndex: number; readonly revealStep: number}>;
  readonly gotoSlide: (index: number) => Effect.Effect<{readonly slideIndex: number; readonly revealStep: number}>;
  readonly setReveal: (step: number) => Effect.Effect<{readonly revealStep: number}>;
  readonly startTimer: (minutes: number) => Effect.Effect<{readonly timerStartedAt: string; readonly timerMinutes: number}>;
  readonly togglePlanB: Effect.Effect<{readonly planB: boolean}>;
  readonly pauseUntil: (iso: string | null) => Effect.Effect<{readonly pauseUntil: string | null}>;
  readonly openLesson: (lesson: string, revision?: number | null) => Effect.Effect<{readonly lesson: string; readonly revision: number | null}>;
  readonly everyoneBackToFollow: Effect.Effect<{readonly pulled: number}>;
  readonly detach: (participantId: string) => Effect.Effect<{readonly following: boolean}>;
  readonly followAgain: (participantId: string) => Effect.Effect<{readonly following: boolean}>;
}

export class LivePresenter extends Context.Service<LivePresenter, LivePresenterShape>()(
  '@academy/actions/LivePresenter',
) {}

export const requireLiveRoom = (live: LivePresenterShape, roomId: string): Effect.Effect<void, Error> =>
  live.roomId === roomId ? Effect.void : Effect.fail(new Error(`caller room "${roomId}" does not match live room "${live.roomId}"`));
