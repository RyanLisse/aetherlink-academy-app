import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {AcademyContent} from './academy-content.ts';

export const suggestDocument = defineAction({
  name: 'suggest_document',
  input: Schema.Struct({
    requestId: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
    quote: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
    content: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4000)),
  }),
  output: Schema.Record(Schema.String, Schema.Unknown),
  scope: 'participant',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const content = yield* AcademyContent;
      return yield* content.suggestDocument({
        roomId: caller.roomId,
        participantId: caller.principalId,
        requestId: input.requestId,
        quote: input.quote,
        content: input.content,
      });
    }),
});
