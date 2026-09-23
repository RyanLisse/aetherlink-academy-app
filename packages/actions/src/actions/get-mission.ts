import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EmptyInput} from '../schemas.ts';
import {AcademyContent} from './academy-content.ts';

export const getMission = defineAction({
  name: 'get_mission',
  input: EmptyInput,
  output: Schema.Record(Schema.String, Schema.Unknown),
  scope: 'participant',
  intent: 'read',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const content = yield* AcademyContent;
      return yield* content.getMission(caller.roomId, caller.principalId);
    }),
});
