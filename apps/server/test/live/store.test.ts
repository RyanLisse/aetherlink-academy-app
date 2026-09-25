import {Effect, Fiber, Stream} from 'effect';
import {describe, expect, test} from 'vitest';
import {LiveStore, LiveStoreMemory} from '../../src/live/store.ts';
import {timerRemainingSeconds} from '../../src/live/types.ts';

const withStore = <A>(effect: Effect.Effect<A, unknown, LiveStore>) =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, LiveStoreMemory())));

describe('LiveStore memory', () => {
  test('everyoneBackToFollow pulls detached participants and publishes notice', async () => {
    const result = await withStore(
      Effect.gen(function* () {
        const store = yield* LiveStore;
        yield* store.upsertFollow({
          roomId: 'r1',
          participantId: 'p1',
          displayName: 'Ada',
          following: false,
          ownIndex: 3,
          lastSeenAt: new Date().toISOString(),
          viewedRevision: null,
          evidenceSubmitted: false,
        });
        yield* store.upsertFollow({
          roomId: 'r1',
          participantId: 'p2',
          displayName: 'Ben',
          following: true,
          ownIndex: 0,
          lastSeenAt: new Date().toISOString(),
          viewedRevision: null,
          evidenceSubmitted: false,
        });
        yield* store.updatePresenter('r1', (p) => ({...p, slideIndex: 2}));
        const follows = yield* store.listFollows('r1');
        for (const f of follows) {
          if (!f.following) yield* store.upsertFollow({...f, following: true, ownIndex: 2});
        }
        yield* store.publish('r1', {type: 'everyoneBackToFollow', notice: 'back'});
        return yield* store.presence('r1');
      }),
    );
    expect(result.detached).toHaveLength(0);
    expect(result.following.map((p) => p.name).sort()).toEqual(['Ada', 'Ben']);
  });

  test('timerRemainingSeconds is reconnect-safe from server timestamps', () => {
    const started = new Date(Date.now() - 90_000).toISOString();
    const remaining = timerRemainingSeconds({
      roomId: 'r1',
      lesson: null,
      slideIndex: 0,
      revealStep: -1,
      timerStartedAt: started,
      timerMinutes: 5,
      planB: false,
      pauseUntil: null,
      updatedAt: started,
      revision: null,
    });
    expect(remaining).toBeGreaterThanOrEqual(209);
    expect(remaining).toBeLessThanOrEqual(211);
  });

  test('subscribe yields presenter updates via Effect Stream', async () => {
    const events = await withStore(
      Effect.gen(function* () {
        const store = yield* LiveStore;
        const collected: string[] = [];
        const fiber = yield* Effect.forkChild(
          Stream.take(store.subscribe('room-stream'), 1).pipe(
            Stream.runForEach((event) =>
              Effect.sync(() => {
                if (event.type === 'presenter') collected.push(`slide:${event.state.slideIndex}`);
              }),
            ),
          ),
        );
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 50)));
        yield* store.updatePresenter('room-stream', (p) => ({...p, slideIndex: 4}));
        yield* Fiber.join(fiber);
        return collected;
      }),
    );
    expect(events).toEqual(['slide:4']);
  });
});
