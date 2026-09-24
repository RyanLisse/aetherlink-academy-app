import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EmptyInput} from '../schemas.ts';
import {
  AmbiguousViewContext,
  ParticipantContext,
  type ParticipantViewBinding,
} from './participant-context.ts';
import {ReleasePolicy} from './release-policy.ts';
import {requireReleased} from './release-gate.ts';

const ProofState = Schema.Struct({
  open: Schema.Boolean,
  section: Schema.NullOr(Schema.String),
});

const QuizState = Schema.Struct({
  id: Schema.NullOr(Schema.String),
  status: Schema.NullOr(Schema.String),
  itemIndex: Schema.NullOr(Schema.Number),
});

const RoomState = Schema.Struct({
  id: Schema.String,
  phase: Schema.NullOr(Schema.String),
  releasedLessonIds: Schema.Array(Schema.String),
});

const bindingKey = (b: ParticipantViewBinding) =>
  [
    b.lessonId ?? '',
    b.slideIndex,
    b.viewedRevision ?? '',
    b.slideId ?? '',
    b.route ?? '',
    b.proofOpen,
    b.proofSection ?? '',
    b.quizId ?? '',
    b.quizStatus ?? '',
    b.quizItemIndex ?? '',
    b.roomPhase ?? '',
    (b.releasedLessonIds ?? []).join(','),
  ].join('::');

/**
 * AET-98 — composite participant screen snapshot for BYO Claude (MCP / WebMCP).
 * Same denial rules as get_current_slide (unreleased / no view / ambiguous tabs).
 */
export const getParticipantScreenState = defineAction({
  name: 'get_screen_state',
  input: EmptyInput,
  output: Schema.Struct({
    lessonId: Schema.NullOr(Schema.String),
    route: Schema.NullOr(Schema.String),
    slideIndex: Schema.Number,
    viewedRevision: Schema.NullOr(Schema.Number),
    latestPublishedRevision: Schema.NullOr(Schema.Number),
    assignmentId: Schema.NullOr(Schema.String),
    proof: ProofState,
    quiz: Schema.NullOr(QuizState),
    room: RoomState,
    browserSessionId: Schema.String,
  }),
  scope: 'participant',
  intent: 'read',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const ctx = yield* ParticipantContext;
      const active = yield* ctx.listActive(caller.roomId, caller.principalId);
      if (active.length === 0) {
        return yield* Effect.fail(
          new Error('No active browser view for this participant. Open the follow view first.'),
        );
      }
      const keys = new Set(active.map(bindingKey));
      if (keys.size > 1) return yield* Effect.fail(new AmbiguousViewContext(active));
      const binding = active[0]!;
      if (binding.lessonId) {
        const policy = yield* ReleasePolicy;
        yield* requireReleased(policy, caller.roomId, binding.lessonId);
      }
      return {
        lessonId: binding.lessonId,
        route: binding.route ?? null,
        slideIndex: binding.slideIndex,
        viewedRevision: binding.viewedRevision,
        latestPublishedRevision: binding.latestPublishedRevision,
        assignmentId: binding.assignmentId,
        proof: {
          open: Boolean(binding.proofOpen),
          section: binding.proofOpen ? (binding.proofSection ?? null) : null,
        },
        quiz: binding.quizId
          ? {
              id: binding.quizId,
              status: binding.quizStatus ?? null,
              itemIndex: binding.quizItemIndex ?? null,
            }
          : null,
        room: {
          id: caller.roomId,
          phase: binding.roomPhase ?? null,
          releasedLessonIds: [...(binding.releasedLessonIds ?? [])],
        },
        browserSessionId: binding.browserSessionId,
      };
    }),
});
