import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {AcademyContent} from './academy-content.ts';

export const searchKnowledge = defineAction({
  name: 'search_knowledge',
  input: Schema.Struct({query: Schema.optional(Schema.String)}),
  output: Schema.Struct({
    lessons: Schema.Array(Schema.Struct({id: Schema.String, title: Schema.String})),
  }),
  scope: 'participant',
  intent: 'read',
  run: (input, _caller) =>
    Effect.gen(function* () {
      const content = yield* AcademyContent;
      return yield* content.searchKnowledge(input.query ?? '');
    }),
});
