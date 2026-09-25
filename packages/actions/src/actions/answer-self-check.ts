import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EvidenceServices} from './evidence-services.ts';

export const answerSelfCheck = defineAction({
  name: 'answer_self_check',
  input: Schema.Struct({
    lessonId: Schema.String.check(Schema.isMinLength(1)),
    day: Schema.optional(Schema.Int),
    answers: Schema.Array(Schema.Int),
  }),
  output: Schema.Struct({
    attempt: Schema.Number,
    explanations: Schema.Array(Schema.String),
    note: Schema.String,
  }),
  scope: 'participant',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const svc = yield* EvidenceServices;
      return yield* svc.answerSelfCheck({
        roomId: caller.roomId,
        participantId: caller.principalId,
        lessonId: input.lessonId,
        day: input.day ?? 1,
        answers: input.answers,
      });
    }),
});
