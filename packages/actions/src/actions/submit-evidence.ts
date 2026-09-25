import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {AcademyContent} from './academy-content.ts';
import {ParticipantContext} from './participant-context.ts';
import {ReleasePolicy} from './release-policy.ts';
import {requireReleased} from './release-gate.ts';

export const submitEvidence = defineAction({
  name: 'submit_evidence',
  input: Schema.Struct({
    requestId: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
    finding: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    command: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(1000)),
    observed: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    limitation: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    lessonId: Schema.optional(Schema.String),
  }),
  output: Schema.Struct({
    id: Schema.String,
    requestId: Schema.String,
    lessonId: Schema.String,
    at: Schema.String,
    status: Schema.Literal('pending'),
  }),
  scope: 'participant',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const ctx = yield* ParticipantContext;
      const active = yield* ctx.listActive(caller.roomId, caller.principalId);
      const lessonId = input.lessonId ?? active[0]?.lessonId;
      if (!lessonId) return yield* Effect.fail(new Error('lessonId required (or open a lesson in the browser).'));
      const policy = yield* ReleasePolicy;
      yield* requireReleased(policy, caller.roomId, lessonId);
      const content = yield* AcademyContent;
      const row = yield* content.submitEvidence({
        requestId: input.requestId,
        participantId: caller.principalId,
        roomId: caller.roomId,
        lessonId,
        finding: input.finding,
        command: input.command,
        observed: input.observed,
        limitation: input.limitation,
      });
      return {id: row.id, requestId: row.requestId, lessonId: row.lessonId, at: row.at, status: 'pending' as const};
    }),
});
