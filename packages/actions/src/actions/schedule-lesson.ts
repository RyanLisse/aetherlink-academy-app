import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {ReleasePolicy, requireSquadRoom} from './release-policy.ts';

const ReleaseState = Schema.Literals(['locked', 'scheduled', 'released']);

export const scheduleLesson = defineAction({
  name: 'scheduleLesson',
  input: Schema.Struct({
    squadId: Schema.String,
    lessonId: Schema.String,
    scheduledAt: Schema.Number,
  }),
  output: Schema.Struct({
    squadId: Schema.String,
    lessonId: Schema.String,
    state: ReleaseState,
    scheduledAt: Schema.NullOr(Schema.Number),
    scheduleRevision: Schema.NullOr(Schema.Number),
  }),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const policy = yield* ReleasePolicy;
      yield* requireSquadRoom(caller.roomId, input.squadId);
      const row = yield* policy.scheduleLesson(input.squadId, input.lessonId, input.scheduledAt);
      return {
        squadId: row.squadId,
        lessonId: row.lessonId,
        state: row.state,
        scheduledAt: row.scheduledAt ?? null,
        scheduleRevision: row.scheduleRevision,
      };
    }),
});
