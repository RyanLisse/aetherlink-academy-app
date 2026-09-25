import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EvidenceServices} from './evidence-services.ts';

export const exportDebrief = defineAction({
  name: 'export_debrief',
  input: Schema.Struct({
    format: Schema.optional(Schema.Literals(['json', 'csv', 'markdown'])),
  }),
  output: Schema.Struct({
    format: Schema.String,
    body: Schema.Unknown,
  }),
  scope: 'facilitator',
  intent: 'read',
  run: (input, caller) =>
    Effect.gen(function* () {
      const format = input.format ?? 'json';
      const svc = yield* EvidenceServices;
      const body = yield* svc.exportDebrief(caller.roomId, format);
      return {format, body};
    }),
});
