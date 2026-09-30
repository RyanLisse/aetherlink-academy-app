import {Effect, Schema} from 'effect';
import {HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup, HttpApiSchema} from 'effect/unstable/httpapi';
import {Connectivity} from '../layers/connectivity.ts';

export const HealthBody = Schema.Struct({
  ok: Schema.Boolean,
  revision: Schema.NullOr(Schema.String),
});

export const HealthUnavailable = Schema.Struct({
  ok: Schema.Literal(false),
  revision: Schema.NullOr(Schema.String),
}).pipe(HttpApiSchema.status(503));

export const ProbeBody = Schema.Struct({
  reachable: Schema.Boolean,
  latencyMs: Schema.Number,
  checkedAt: Schema.String,
  error: Schema.NullOr(Schema.String),
});

export const ConnectionBody = Schema.Struct({
  postgres: ProbeBody,
  redis: ProbeBody,
  checkedAt: Schema.String,
});

export const SystemGroup = HttpApiGroup.make('system', {topLevel: true})
  .add(HttpApiEndpoint.get('health', '/health', {success: HealthBody, error: HealthUnavailable}))
  .add(HttpApiEndpoint.get('connection', '/connection', {success: ConnectionBody}));

export const AcademyApi = HttpApi.make('academy').add(SystemGroup);

export const SystemGroupLive = HttpApiBuilder.group(AcademyApi, 'system', (handlers) =>
  Effect.gen(function* () {
    const connectivity = yield* Connectivity;
    return handlers
      .handle('health', () =>
        connectivity.health.pipe(
          Effect.flatMap((report) =>
            report.ok
              ? Effect.succeed(report)
              : Effect.fail({ok: false as const, revision: report.revision}),
          ),
        ),
      )
      .handle('connection', () => connectivity.report);
  }),
);
