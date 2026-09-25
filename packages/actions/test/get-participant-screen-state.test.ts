import {Effect, Layer} from 'effect';
import {describe, expect, test} from 'vitest';
import type {Caller} from '../src/caller.ts';
import {getParticipantScreenState} from '../src/actions/get-participant-screen-state.ts';
import {
  AmbiguousViewContext,
  ParticipantContext,
  ParticipantContextMemory,
  type ParticipantViewBinding,
} from '../src/actions/participant-context.ts';
import {ReleasePolicy, type ReleasePolicyShape} from '../src/actions/release-policy.ts';
import {LessonNotReleased} from '../src/actions/release-gate.ts';

const ROOM = 'room-1';
const RELEASED = new Set(['lesson-a', 'lesson-b']);

const releasePolicy: ReleasePolicyShape = {
  isReleased: (squadId, lessonId) => Effect.succeed(squadId === ROOM && RELEASED.has(lessonId)),
  releaseLesson: () => Effect.die('unused'),
  scheduleLesson: () => Effect.die('unused'),
  cancelSchedule: () => Effect.die('unused'),
};

const caller = (principalId: string): Caller => ({principalId, roomId: ROOM, role: 'participant'});

const binding = (overrides: Partial<ParticipantViewBinding> = {}): ParticipantViewBinding => ({
  browserSessionId: 'tab-1',
  roomId: ROOM,
  participantId: 'participant-1',
  lessonId: 'lesson-a',
  slideIndex: 2,
  slideId: 's2',
  viewedRevision: 4,
  latestPublishedRevision: 5,
  assignmentId: 'asg-1',
  route: '/workshop/5',
  proofOpen: false,
  proofSection: null,
  quizId: null,
  quizStatus: null,
  quizItemIndex: null,
  roomPhase: 'solo',
  releasedLessonIds: ['lesson-a'],
  updatedAt: Date.now(),
  ...overrides,
});

const run = (views: ReadonlyArray<ParticipantViewBinding>, principalId = 'participant-1') =>
  Effect.gen(function* () {
    const ctx = yield* ParticipantContextMemory();
    for (const view of views) yield* ctx.upsert(view);
    return yield* getParticipantScreenState.run({}, caller(principalId)).pipe(
      Effect.provide(Layer.mergeAll(Layer.succeed(ParticipantContext, ctx), Layer.succeed(ReleasePolicy, releasePolicy))),
      Effect.result,
    );
  }).pipe(Effect.runPromise);

describe('get_screen_state release authority', () => {
  test('drops client-reported lesson ids that the release policy says are locked', async () => {
    const result = await run([binding({releasedLessonIds: ['lesson-a', 'lesson-locked', 'lesson-b']})]);
    expect(result._tag).toBe('Success');
    if (result._tag === 'Success') {
      expect(result.success.room).toEqual({id: 'room-1', phase: 'solo', releasedLessonIds: ['lesson-a', 'lesson-b']});
    }
  });

  test('null reported release list stays empty', async () => {
    const result = await run([binding({releasedLessonIds: null})]);
    expect(result._tag).toBe('Success');
    if (result._tag === 'Success') expect(result.success.room.releasedLessonIds).toEqual([]);
  });

  test('bound lesson that is not released is denied with LessonNotReleased', async () => {
    const result = await run([binding({lessonId: 'lesson-locked', releasedLessonIds: ['lesson-locked']})]);
    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      expect(result.failure).toBeInstanceOf(LessonNotReleased);
      expect((result.failure as LessonNotReleased).lessonId).toBe('lesson-locked');
    }
  });

  test('no active view fails with the open-follow-view error', async () => {
    const result = await run([]);
    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      expect((result.failure as Error).message).toBe(
        'No active browser view for this participant. Open the follow view first.',
      );
    }
  });

  test('two tabs on different slides are ambiguous', async () => {
    const result = await run([binding(), binding({browserSessionId: 'tab-2', slideIndex: 3})]);
    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      expect(result.failure).toBeInstanceOf(AmbiguousViewContext);
      expect((result.failure as AmbiguousViewContext).message).toBe(
        'Multiple browser tabs report different view context (lesson, slide, assignment, Proof, quiz or room phase). Select one tab and retry.',
      );
      expect((result.failure as AmbiguousViewContext).sessions.map((s) => s.browserSessionId)).toEqual(['tab-1', 'tab-2']);
    }
  });

  test('tabs that only disagree on reported release lists are not ambiguous; ids are unioned then filtered', async () => {
    const result = await run([
      binding({releasedLessonIds: ['lesson-a']}),
      binding({browserSessionId: 'tab-2', releasedLessonIds: ['lesson-b', 'lesson-locked']}),
    ]);
    expect(result._tag).toBe('Success');
    if (result._tag === 'Success') expect(result.success.room.releasedLessonIds).toEqual(['lesson-a', 'lesson-b']);
  });

  test('a second participant in the same room cannot read the first participant state', async () => {
    const result = await run([binding({proofOpen: true, proofSection: 'evidence'})], 'participant-2');
    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      expect((result.failure as Error).message).toBe(
        'No active browser view for this participant. Open the follow view first.',
      );
    }
  });
});
