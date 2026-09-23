import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const setReveal = defineAction({
  name: 'setReveal',
  input: Schema.Struct({step: Schema.Int}),
  output: Schema.Struct({revealStep: Schema.Number}),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.setReveal(input.step);
    }),
});
