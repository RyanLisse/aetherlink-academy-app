import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EmptyInput} from '../schemas.ts';
import {AcademyContent} from './academy-content.ts';

export const getMyProgress = defineAction({
  name: 'get_my_progress',
  input: EmptyInput,
  output: Schema.Struct({
    participantId: Schema.String,
    roomId: Schema.String,
    items: Schema.Array(
      Schema.Struct({
        lessonId: Schema.String,
        completed: Schema.Boolean,
        evidenceCount: Schema.Number,
        lastSlideIndex: Schema.Number,
      }),
    ),
  }),
  scope: 'participant',
  intent: 'read',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const content = yield* AcademyContent;
      const items = yield* content.getProgress(caller.roomId, caller.principalId);
      return {participantId: caller.principalId, roomId: caller.roomId, items: [...items]};
    }),
});
