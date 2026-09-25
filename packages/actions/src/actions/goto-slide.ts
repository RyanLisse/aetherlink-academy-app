import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const gotoSlide = defineAction({
  name: 'gotoSlide',
  input: Schema.Struct({index: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))}),
  output: Schema.Struct({slideIndex: Schema.Number, revealStep: Schema.Number}),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.gotoSlide(input.index);
    }),
});
