import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {LivePresenter, requireLiveRoom} from './live-state.ts';

export const pauseUntil = defineAction({
  name: 'pauseUntil',
  input: Schema.Struct({until: Schema.NullOr(Schema.String)}),
  output: Schema.Struct({pauseUntil: Schema.NullOr(Schema.String)}),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const live = yield* LivePresenter;
      yield* requireLiveRoom(live, caller.roomId);
      return yield* live.pauseUntil(input.until);
    }),
});
