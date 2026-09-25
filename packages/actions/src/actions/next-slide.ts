import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const nextSlide = defineAction({
  name: 'nextSlide',
  input: Schema.Struct({}),
  output: Schema.Struct({slideIndex: Schema.Number, revealStep: Schema.Number}),
  scope: 'facilitator',
  intent: 'explicit',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.nextSlide;
    }),
});
