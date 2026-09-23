/**
 * Standalone live-sync server for Playwright / local demos.
 * Usage: ACADEMY_LIVE_PORT=4320 node --experimental-strip-types src/live/standalone.ts
 */
import {createServer} from 'node:http';
import {Effect} from 'effect';
import {attachLiveHttp} from './http.ts';
import {LiveStore, LiveStoreMemory} from './store.ts';

const port = Number(process.env.ACADEMY_LIVE_PORT ?? 4320);
const host = process.env.ACADEMY_LIVE_HOST ?? '127.0.0.1';

const program = Effect.gen(function* () {
  const store = yield* LiveStore;
  const server = createServer((_req, res) => {
    res.writeHead(404);
    res.end('not found');
  });
  attachLiveHttp(server, store);
  yield* Effect.callback<void>((resume) => {
    server.listen(port, host, () => {
      console.log(`live-sync listening on http://${host}:${port}`);
      resume(Effect.void);
    });
  });
  yield* Effect.never;
});

Effect.runPromise(Effect.scoped(Effect.provide(program, LiveStoreMemory()))).catch((error) => {
  console.error(error);
  process.exit(1);
});
