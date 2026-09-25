/**
 * Combined static web + live-sync server for Playwright AC.
 * Serves apps/web/dist and /live/* (REST, SSE, WS) on ACADEMY_LIVE_PORT (default 5178).
 */
import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Effect} from 'effect';
import {attachLiveHttp, handleLiveRequest} from './http.ts';
import {LiveStore, LiveStoreMemory} from './store.ts';

const port = Number(process.env.ACADEMY_LIVE_PORT ?? 5178);
const host = process.env.ACADEMY_LIVE_HOST ?? '127.0.0.1';
const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(process.env.ACADEMY_WEB_DIST?.trim() || path.resolve(here, '../../../web/dist'));

const contentType = (file: string): string => {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.webp')) return 'image/webp';
  if (file.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
};

const program = Effect.gen(function* () {
  const store = yield* LiveStore;
  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleLiveRequest(store, req, res);
      if (handled) return;
      const url = new URL(req.url ?? '/', 'http://localhost');
      let target = path.resolve(webDist, `.${decodeURIComponent(url.pathname)}`);
      if (!target.startsWith(webDist)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (!existsSync(target) || statSync(target).isDirectory()) {
        target = path.join(webDist, 'index.html');
      }
      if (!existsSync(target)) {
        res.writeHead(404);
        res.end('missing web dist — build @academy/web first');
        return;
      }
      res.writeHead(200, {'content-type': contentType(target)});
      createReadStream(target).pipe(res);
    })();
  });
  attachLiveHttp(server, store);
  yield* Effect.callback<void>((resume) => {
    server.listen(port, host, () => {
      console.log(`AET-26 live e2e server http://${host}:${port} web=${webDist}`);
      resume(Effect.void);
    });
  });
  yield* Effect.never;
});

Effect.runPromise(Effect.scoped(Effect.provide(program, LiveStoreMemory()))).catch((error) => {
  console.error(error);
  process.exit(1);
});
