import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {AcademyContent} from './academy-content.ts';
import {ParticipantContext} from './participant-context.ts';
import {ReleasePolicy} from './release-policy.ts';
import {requireReleased} from './release-gate.ts';

export const openHint = defineAction({
  name: 'open_hint',
  input: Schema.Struct({
    assignmentId: Schema.optional(Schema.String),
    index: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  }),
  output: Schema.Struct({
    assignmentId: Schema.String,
    index: Schema.Number,
    hint: Schema.String,
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
        assignmentId = active[0]?.assignmentId ?? undefined;
      }
      if (!assignmentId) return yield* Effect.fail(new Error('assignmentId required.'));
      const assignment = yield* content.getAssignment(assignmentId);
      if (!assignment) return yield* Effect.fail(new Error('Assignment not found.'));
      const policy = yield* ReleasePolicy;
      yield* requireReleased(policy, caller.roomId, assignment.lessonId);
      const opened = yield* content.openHint(assignmentId, input.index);
      if (!opened) return yield* Effect.fail(new Error('Hint index out of range.'));
      return {assignmentId, index: opened.index, hint: opened.hint};
    }),
});
