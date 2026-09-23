import {Effect, Layer} from 'effect';
import {LivePresenter, type LivePresenterShape} from '@academy/actions';
import {LiveStore} from './store.ts';
import {defaultFollow} from './types.ts';

const NOTICE = 'De facilitator vraagt iedereen terug te volgen.';

/** Bind a LiveStore room to the actions LivePresenter service. */
export const LivePresenterFromStore = (roomId: string, slideCount = Number.MAX_SAFE_INTEGER): Layer.Layer<LivePresenter, never, LiveStore> =>
  Layer.effect(
    LivePresenter,
    Effect.gen(function* () {
      const store = yield* LiveStore;
      const shape: LivePresenterShape = {
        roomId,
        get: store.getPresenter(roomId).pipe(
          Effect.map((p) => ({
            lesson: p.lesson,
            slideIndex: p.slideIndex,
            revealStep: p.revealStep,
            timerStartedAt: p.timerStartedAt,
            timerMinutes: p.timerMinutes,
            planB: p.planB,
            pauseUntil: p.pauseUntil,
            revision: p.revision,
          })),
        ),
        nextSlide: store.updatePresenter(roomId, (p) => ({
          ...p,
          slideIndex: Math.min(p.slideIndex + 1, Math.max(0, slideCount - 1)),
          revealStep: -1,
        })).pipe(Effect.map((p) => ({slideIndex: p.slideIndex, revealStep: p.revealStep}))),
        prevSlide: store.updatePresenter(roomId, (p) => ({
          ...p,
          slideIndex: Math.max(0, p.slideIndex - 1),
          revealStep: -1,
        })).pipe(Effect.map((p) => ({slideIndex: p.slideIndex, revealStep: p.revealStep}))),
        gotoSlide: (index) =>
          store.updatePresenter(roomId, (p) => ({
            ...p,
            slideIndex: Math.max(0, Math.min(index, Math.max(0, slideCount - 1))),
            revealStep: -1,
          })).pipe(Effect.map((p) => ({slideIndex: p.slideIndex, revealStep: p.revealStep}))),
        setReveal: (step) =>
          store.updatePresenter(roomId, (p) => ({...p, revealStep: step})).pipe(
            Effect.map((p) => ({revealStep: p.revealStep})),
          ),
        startTimer: (minutes) =>
          store.updatePresenter(roomId, (p) => ({
            ...p,
            timerStartedAt: new Date().toISOString(),
            timerMinutes: minutes,
            pauseUntil: null,
          })).pipe(
            Effect.map((p) => ({
              timerStartedAt: p.timerStartedAt!,
              timerMinutes: p.timerMinutes!,
            })),
          ),
        togglePlanB: store.updatePresenter(roomId, (p) => ({...p, planB: !p.planB})).pipe(
          Effect.map((p) => ({planB: p.planB})),
        ),
        pauseUntil: (until) =>
          store.updatePresenter(roomId, (p) => ({...p, pauseUntil: until})).pipe(
            Effect.map((p) => ({pauseUntil: p.pauseUntil})),
          ),
        openLesson: (lesson, revision = null) =>
          store.updatePresenter(roomId, (p) => ({
            ...p,
            lesson,
            revision: revision ?? p.revision,
            slideIndex: 0,
            revealStep: -1,
          })).pipe(Effect.map((p) => ({lesson: p.lesson!, revision: p.revision}))),
        everyoneBackToFollow: Effect.gen(function* () {
          const follows = yield* store.listFollows(roomId);
          let pulled = 0;
          for (const follow of follows) {
            if (!follow.following) {
              pulled += 1;
              yield* store.upsertFollow({...follow, following: true, ownIndex: (yield* store.getPresenter(roomId)).slideIndex});
            }
          }
          yield* store.publish(roomId, {type: 'everyoneBackToFollow', notice: NOTICE});
          yield* store.publish(roomId, {type: 'notice', notice: NOTICE});
          return {pulled};
        }),
        detach: (participantId) =>
          Effect.gen(function* () {
            const current = yield* store.getFollow(roomId, participantId);
            const presenter = yield* store.getPresenter(roomId);
            const next = yield* store.upsertFollow({
              ...current,
              displayName: current.displayName || participantId,
              following: false,
              ownIndex: presenter.slideIndex,
            });
            return {following: next.following};
          }),
        followAgain: (participantId) =>
          Effect.gen(function* () {
            const current = yield* store.getFollow(roomId, participantId);
            const presenter = yield* store.getPresenter(roomId);
            const next = yield* store.upsertFollow({
              ...defaultFollow(roomId, participantId, current.displayName || participantId),
              ...current,
              following: true,
              ownIndex: presenter.slideIndex,
              viewedRevision: presenter.revision,
            });
            return {following: next.following};
          }),
      };
      return shape;
    }),
  );
