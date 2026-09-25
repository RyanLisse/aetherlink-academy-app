import {Layer} from 'effect';
import {HttpApiBuilder} from 'effect/unstable/httpapi';
import {AuthoringFromEnv} from './authoring/index.ts';
import {AcademyApi, SystemGroupLive} from './http/health.ts';
import {StaticWebLive} from './http/static.ts';
import {FacilitatorAuthFromEnv} from './identity/facilitator-auth.ts';
import {GoogleSsoRoutes} from './identity/google-routes.ts';
import {ServerConfig, ServerConfigLive} from './layers/config.ts';
import {Connectivity, ConnectivityLive} from './layers/connectivity.ts';
import {Postgres, PostgresFromConfig} from './layers/postgres.ts';
import {ProofBridge, ProofBridgeLive} from './layers/proof-bridge.ts';
import {Redis, RedisLive} from './layers/redis.ts';

export const ApiRoutes = HttpApiBuilder.layer(AcademyApi).pipe(Layer.provide(SystemGroupLive));

export const routes = (webDist: string | null) => Layer.mergeAll(ApiRoutes, StaticWebLive(webDist));

export const ServicesLive: Layer.Layer<Connectivity | Postgres | Redis | ProofBridge, never, ServerConfig> = ConnectivityLive.pipe(
  Layer.provideMerge(Layer.mergeAll(PostgresFromConfig, RedisLive, ProofBridgeLive)),
);

export const AppLive = (env: NodeJS.ProcessEnv = process.env) => {
  const webDist = env.ACADEMY_WEB_DIST?.trim() || null;
  return Layer.mergeAll(routes(webDist), GoogleSsoRoutes, AuthoringFromEnv(env)).pipe(
    Layer.provide(FacilitatorAuthFromEnv(env)),
    Layer.provide(ServicesLive),
    Layer.provide(ServerConfigLive(env)),
  );
};
