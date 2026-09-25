import {Layer} from 'effect';
import {HttpApiBuilder} from 'effect/unstable/httpapi';
import {AuthoringLive} from './authoring/index.ts';
import {AcademyApi, SystemGroupLive} from './http/health.ts';
import {StaticWebLive} from './http/static.ts';
import {ServerConfig, ServerConfigLive} from './layers/config.ts';
import {Connectivity, ConnectivityLive} from './layers/connectivity.ts';
import {Postgres, PostgresFromConfig} from './layers/postgres.ts';
import {ProofBridge, ProofBridgeLive} from './layers/proof-bridge.ts';
import {Redis, RedisLive} from './layers/redis.ts';

export const ApiRoutes = HttpApiBuilder.layer(AcademyApi).pipe(Layer.provide(SystemGroupLive));

export const routes = (webDist: string | null, env: NodeJS.ProcessEnv = process.env) =>
  Layer.mergeAll(ApiRoutes, StaticWebLive(webDist), AuthoringLive(env));

export const ServicesLive: Layer.Layer<Connectivity | Postgres | Redis | ProofBridge, never, ServerConfig> = ConnectivityLive.pipe(
  Layer.provideMerge(Layer.mergeAll(PostgresFromConfig, RedisLive, ProofBridgeLive)),
);

export const AppLive = (env: NodeJS.ProcessEnv = process.env) => {
  const webDist = env.ACADEMY_WEB_DIST?.trim() || null;
  return routes(webDist, env).pipe(Layer.provide(ServicesLive), Layer.provide(ServerConfigLive(env)));
};
