import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EvidenceServices} from './evidence-services.ts';

export const reviewEvidence = defineAction({
  name: 'review_evidence',
  input: Schema.Struct({
    evidenceId: Schema.String.check(Schema.isMinLength(1)),
    status: Schema.Literals(['accepted', 'revise', 'open', 'pending']),
    note: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
  }),
  output: Schema.Struct({
    id: Schema.String,
    status: Schema.String,
  }),
  scope: 'both',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const svc = yield* EvidenceServices;
      return yield* svc.reviewEvidence({
        evidenceId: input.evidenceId,
        roomId: caller.roomId,
        reviewerId: caller.principalId,
        status: input.status,
        note: input.note,
      });
    }),
});
