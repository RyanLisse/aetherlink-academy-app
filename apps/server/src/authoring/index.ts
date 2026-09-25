import {Effect, Layer} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {CurriculumRepo, CurriculumRepoLive, type CurriculumRepoShape} from '../db/curriculum-repo.ts';
import {FacilitatorAuth, FacilitatorAuthMemory, type FacilitatorAuthShape} from '../identity/facilitator-auth.ts';
import {PgClientLive} from '../layers/postgres.ts';
import type {ServerConfig} from '../layers/config.ts';
import {readAuthoringConfig} from './config.ts';
import {createAuthoringHandler} from './http.ts';
import {AuthoringStore} from './store.ts';
import {SlidesUpstream} from './upstream.ts';

export interface AuthoringServices {
  readonly curriculum?: CurriculumRepoShape;
  readonly facilitators?: Pick<FacilitatorAuthShape, 'current'>;
}

/**
 * Opt-in lesson authoring. Disabled (no routes mounted, every path 404s)
 * unless `ACADEMY_AUTHORING_ENABLED=true` and every required env var is
 * present and well-formed — see `readAuthoringConfig`.
 */
export const AuthoringLive = (env: NodeJS.ProcessEnv, services: AuthoringServices = {}): Layer.Layer<never, never, HttpRouter.HttpRouter> => {
  const config = readAuthoringConfig(env);
  if (!config) return Layer.empty as Layer.Layer<never, never, HttpRouter.HttpRouter>;
  const store = new AuthoringStore(config.dataDir);
  const upstream = new SlidesUpstream(config.upstream, config.upstreamTimeoutMs);
  const handler = createAuthoringHandler({config, store, upstream, ...services});
  return HttpRouter.add('*', '/authoring-api/*', handler);
};

/**
 * Server wiring: when authoring is enabled, publish into the curriculum
 * Postgres (`DATABASE_URL`) and accept Google SSO facilitator sessions.
 * The Postgres pool is only built when the flag is on, so a disabled
 * deployment never opens a curriculum connection.
 */
export const AuthoringFromEnv = (env: NodeJS.ProcessEnv): Layer.Layer<never, never, HttpRouter.HttpRouter | ServerConfig> => {
  if (!readAuthoringConfig(env)) return Layer.empty as Layer.Layer<never, never, HttpRouter.HttpRouter>;
  const mounted = Layer.unwrap(
    Effect.gen(function* () {
      const curriculum = yield* CurriculumRepo;
      const facilitators = yield* FacilitatorAuth;
      return AuthoringLive(env, {curriculum, facilitators});
    }),
  );
  return mounted.pipe(Layer.provide(Layer.mergeAll(CurriculumRepoLive.pipe(Layer.provide(PgClientLive)), FacilitatorAuthMemory())));
};
