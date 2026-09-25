import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const openLesson = defineAction({
  name: 'openLesson',
  input: Schema.Struct({
    lesson: Schema.String,
    revision: Schema.optional(Schema.NullOr(Schema.Int)),
  }),
  output: Schema.Struct({lesson: Schema.String, revision: Schema.NullOr(Schema.Number)}),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.openLesson(input.lesson, input.revision ?? null);
    }),
});
