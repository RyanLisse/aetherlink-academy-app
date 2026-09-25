import {describe, expect, test} from 'vitest';
import {runParticipantScreenState} from '../src/adapters/screen-state-host.ts';
import type {ParticipantViewBinding} from '../src/actions/participant-context.ts';

const caller = {principalId: 'ann', roomId: 'room-1', role: 'participant'} as const;

const binding = (overrides: Partial<ParticipantViewBinding> = {}): ParticipantViewBinding => ({
  browserSessionId: 'tab-1',
  roomId: 'room-1',
  participantId: 'ann',
  lessonId: null,
  slideIndex: 0,
  slideId: null,
  viewedRevision: null,
  latestPublishedRevision: null,
  assignmentId: null,
  route: 'squad',
  proofOpen: true,
  proofSection: null,
  quizId: null,
  quizStatus: null,
  quizItemIndex: null,
  roomPhase: 'lesson',
  releasedLessonIds: ['day-1', 'day-2'],
  updatedAt: 1,
  ...overrides,
});

describe('runParticipantScreenState', () => {
  test('keeps only lessons the host confirms released', async () => {
    const state = await runParticipantScreenState(caller, {
      listActive: async () => [binding()],
      isReleased: async (_squad, lesson) => lesson === 'day-2',
    });
    expect(state.room).toEqual({id: 'room-1', phase: 'lesson', releasedLessonIds: ['day-2']});
  });

  test('treats a failing release source as locked', async () => {
    const state = await runParticipantScreenState(caller, {
      listActive: async () => [binding()],
      isReleased: async () => {
        throw new Error('release store down');
      },
    });
    expect(state.room.releasedLessonIds).toEqual([]);
  });

  test('denies a heartbeat on an unreleased lesson with the locked-lesson status', async () => {
    const failure = runParticipantScreenState(caller, {
      listActive: async () => [binding({lessonId: 'day-3'})],
      isReleased: async () => false,
    });
    await expect(failure).rejects.toMatchObject({message: 'Lesson not found.', status: 404});
  });

  test('asks the host only for the caller\'s own room and participant', async () => {
    const asked: Array<[string, string]> = [];
    await runParticipantScreenState(caller, {
      listActive: async (roomId, participantId) => {
        asked.push([roomId, participantId]);
        return [binding()];
      },
      isReleased: async () => true,
    });
    expect(asked).toEqual([['room-1', 'ann']]);
  });
});
