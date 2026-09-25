import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {ReleasePolicy, requireSquadRoom} from './release-policy.ts';

const ReleaseState = Schema.Literals(['locked', 'scheduled', 'released']);

export const cancelSchedule = defineAction({
  name: 'cancelSchedule',
  input: Schema.Struct({
    squadId: Schema.String,
    lessonId: Schema.String,
  }),
  output: Schema.Struct({
    squadId: Schema.String,
    lessonId: Schema.String,
    state: ReleaseState,
    scheduleRevision: Schema.NullOr(Schema.Number),
  }),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const policy = yield* ReleasePolicy;
      yield* requireSquadRoom(caller.roomId, input.squadId);
      const row = yield* policy.cancelSchedule(input.squadId, input.lessonId);
      return {
        squadId: row.squadId,
        lessonId: row.lessonId,
        state: row.state,
        scheduleRevision: row.scheduleRevision,
      };
    }),
});
