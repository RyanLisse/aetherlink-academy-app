import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {AcademyContent} from './academy-content.ts';
import {AmbiguousViewContext, ParticipantContext} from './participant-context.ts';
import {ReleasePolicy} from './release-policy.ts';
import {requireReleased} from './release-gate.ts';

export const getAssignment = defineAction({
  name: 'get_assignment',
  input: Schema.Struct({assignmentId: Schema.optional(Schema.String)}),
  output: Schema.Struct({
    id: Schema.String,
    lessonId: Schema.String,
    title: Schema.String,
    prompt: Schema.String,
    hintCount: Schema.Number,
  }),
  scope: 'participant',
  intent: 'read',
  run: (input, caller) =>
    Effect.gen(function* () {
      const content = yield* AcademyContent;
      let assignmentId = input.assignmentId;
      if (!assignmentId) {
        const ctx = yield* ParticipantContext;
        const active = yield* ctx.listActive(caller.roomId, caller.principalId);
        if (active.length === 0) return yield* Effect.fail(new Error('No active browser view.'));
        const ids = new Set(active.map((a) => a.assignmentId));
        if (ids.size > 1) return yield* Effect.fail(new AmbiguousViewContext(active));
        assignmentId = active[0]!.assignmentId ?? undefined;
      }
      if (!assignmentId) return yield* Effect.fail(new Error('No assignment on the current slide.'));
      const assignment = yield* content.getAssignment(assignmentId);
      if (!assignment) return yield* Effect.fail(new Error('Assignment not found.'));
      const policy = yield* ReleasePolicy;
      yield* requireReleased(policy, caller.roomId, assignment.lessonId);
      return {
        id: assignment.id,
        lessonId: assignment.lessonId,
        title: assignment.title,
        prompt: assignment.prompt,
        hintCount: assignment.hints.length,
      };
    }),
});
