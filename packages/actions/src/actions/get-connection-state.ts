import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EmptyInput} from '../schemas.ts';
import {AcademyContent} from './academy-content.ts';

const ConnectionState = Schema.Union([
  Schema.Literal('configured'),
  Schema.Literal('connected'),
  Schema.Literal('verified'),
]);

export const getConnectionState = defineAction({
  name: 'get_connection_state',
  input: EmptyInput,
  output: Schema.Struct({
    state: ConnectionState,
    roomId: Schema.String,
    participantId: Schema.String,
  }),
  scope: 'participant',
  intent: 'read',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const content = yield* AcademyContent;
      const state = yield* content.connectionState(caller.roomId, caller.principalId);
      return {state, roomId: caller.roomId, participantId: caller.principalId};
    }),
});
