import {Layer} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {readAuthoringConfig} from './config.ts';
import {createAuthoringHandler} from './http.ts';
import {AuthoringStore} from './store.ts';
import {SlidesUpstream} from './upstream.ts';

/**
 * Opt-in lesson-authoring PoC. Disabled (no routes mounted) unless
 * `ACADEMY_AUTHORING_ENABLED=true` and every required env var is present and
 * well-formed — see `readAuthoringConfig`.
 */
export const AuthoringLive = (env: NodeJS.ProcessEnv): Layer.Layer<never, never, HttpRouter.HttpRouter> => {
  const config = readAuthoringConfig(env);
  if (!config) return Layer.empty as Layer.Layer<never, never, HttpRouter.HttpRouter>;
  const store = new AuthoringStore(config.dataDir);
  const upstream = new SlidesUpstream(config.upstream, config.upstreamTimeoutMs);
  const handler = createAuthoringHandler({config, store, upstream});
  return HttpRouter.add('*', '/authoring-api/*', handler);
};
