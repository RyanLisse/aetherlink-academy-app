import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {ReleasePolicy, requireSquadRoom} from './release-policy.ts';

const ReleaseState = Schema.Literals(['locked', 'scheduled', 'released']);

export const releaseLesson = defineAction({
  name: 'releaseLesson',
  input: Schema.Struct({
    squadId: Schema.String,
    lessonId: Schema.String,
  }),
  output: Schema.Struct({
    squadId: Schema.String,
    lessonId: Schema.String,
    state: ReleaseState,
    releasedBy: Schema.NullOr(Schema.String),
    scheduleRevision: Schema.NullOr(Schema.Number),
  }),
  scope: 'facilitator',
  intent: 'explicit',
  run: (input, caller) =>
    Effect.gen(function* () {
      const policy = yield* ReleasePolicy;
      yield* requireSquadRoom(caller.roomId, input.squadId);
      const row = yield* policy.releaseLesson(input.squadId, input.lessonId, caller.principalId);
      return {
        squadId: row.squadId,
        lessonId: row.lessonId,
        state: row.state,
        releasedBy: row.releasedBy ?? null,
        scheduleRevision: row.scheduleRevision,
      };
    }),
});
