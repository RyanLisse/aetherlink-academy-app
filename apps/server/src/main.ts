import {createServer} from 'node:http';
import {NodeHttpServer, NodeRuntime} from '@effect/platform-node';
import {Effect, Layer} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {AppLive} from './app.ts';
import {readConfig} from './layers/config.ts';

const program = Effect.gen(function* () {
  const config = yield* readConfig(process.env);
  yield* Effect.log(
    `Academy wave foundation listening on http://${config.host}:${config.port} (revision ${config.revision ?? 'unknown'})`,
  );
  const server = HttpRouter.serve(AppLive(process.env), {disableListenLog: true}).pipe(
    Layer.provide(NodeHttpServer.layer(() => createServer(), {port: config.port, host: config.host})),
  );
  yield* Layer.launch(server);
});

NodeRuntime.runMain(program);
