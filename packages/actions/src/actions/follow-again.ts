import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const followAgain = defineAction({
  name: 'followAgain',
  input: Schema.Struct({}),
  output: Schema.Struct({following: Schema.Boolean}),
  scope: 'participant',
  intent: 'explicit',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.followAgain(caller.principalId);
    }),
});
