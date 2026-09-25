import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EvidenceServices} from './evidence-services.ts';

export const handoff = defineAction({
  name: 'handoff',
  input: Schema.Struct({
    requestId: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
    day: Schema.optional(Schema.Int),
    decision: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    checked: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    open: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    next: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(500)),
  }),
  output: Schema.Struct({
    id: Schema.String,
    day: Schema.Number,
  }),
  scope: 'both',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const svc = yield* EvidenceServices;
      return yield* svc.handoff({
        requestId: input.requestId,
        roomId: caller.roomId,
        day: input.day ?? 1,
        by: caller.principalId,
        decision: input.decision,
        checked: input.checked,
        open: input.open,
        next: input.next,
      });
    }),
});
