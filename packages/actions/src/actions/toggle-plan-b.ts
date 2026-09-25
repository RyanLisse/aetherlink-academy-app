import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const togglePlanB = defineAction({
  name: 'togglePlanB',
  input: Schema.Struct({}),
  output: Schema.Struct({planB: Schema.Boolean}),
  scope: 'facilitator',
  intent: 'explicit',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.togglePlanB;
    }),
});
