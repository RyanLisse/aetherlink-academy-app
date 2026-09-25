import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EvidenceServices} from './evidence-services.ts';

const Target = Schema.Struct({
  targetKind: Schema.Literals(['lesson', 'assignment']),
  targetId: Schema.String.check(Schema.isMinLength(1)),
});

export const markPractised = defineAction({
  name: 'mark_practised',
  input: Target,
  output: Schema.Struct({practised: Schema.Literal(true)}),
  scope: 'participant',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const svc = yield* EvidenceServices;
      return yield* svc.markPractised(caller.roomId, caller.principalId, input.targetKind, input.targetId);
    }),
});

export const unmarkPractised = defineAction({
  name: 'unmark_practised',
  input: Target,
  output: Schema.Struct({practised: Schema.Literal(false)}),
  scope: 'participant',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const svc = yield* EvidenceServices;
      return yield* svc.unmarkPractised(caller.roomId, caller.principalId, input.targetKind, input.targetId);
    }),
});
