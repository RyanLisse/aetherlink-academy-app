import type {IncomingMessage, Server, ServerResponse} from 'node:http';
import {WebSocketServer, type WebSocket} from 'ws';
import {Effect, Fiber, Stream} from 'effect';
import type {LiveStoreShape} from './store.ts';
import {defaultFollow, timerRemainingSeconds, type LiveEvent, type PresenterLiveState} from './types.ts';

const NOTICE = 'De facilitator vraagt iedereen terug te volgen.';

const readJson = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, x-participant-id, x-participant-name, x-role',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  });
  res.end(payload);
};

const matchLive = (url: URL): {roomId: string; rest: string} | null => {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'live' || !parts[1]) return null;
  return {roomId: decodeURIComponent(parts[1]), rest: parts.slice(2).join('/')};
};

const run = <A>(effect: Effect.Effect<A, unknown>): Promise<A> => Effect.runPromise(effect);

const applyCommand = async (
  store: LiveStoreShape,
  roomId: string,
  command: string,
  body: Record<string, unknown>,
  actor: {id: string; name: string; role: 'facilitator' | 'participant'},
): Promise<unknown> => {
  switch (command) {
    case 'join': {
      const follow = await run(store.getFollow(roomId, actor.id));
      const next = await run(
        store.upsertFollow({
          ...defaultFollow(roomId, actor.id, actor.name),
          ...follow,
          displayName: actor.name,
          following: follow.following ?? true,
        }),
      );
      const presenter = await run(store.getPresenter(roomId));
      const presence = await run(store.presence(roomId));
      return {presenter, follow: next, presence, timerRemaining: timerRemainingSeconds(presenter)};
    }
    case 'nextSlide':
      return run(store.updatePresenter(roomId, (p) => ({...p, slideIndex: p.slideIndex + 1, revealStep: -1})));
    case 'prevSlide':
      return run(store.updatePresenter(roomId, (p) => ({...p, slideIndex: Math.max(0, p.slideIndex - 1), revealStep: -1})));
    case 'gotoSlide':
      return run(
        store.updatePresenter(roomId, (p) => ({
          ...p,
          slideIndex: Math.max(0, Number(body.index) || 0),
          revealStep: -1,
        })),
      );
    case 'setReveal':
      return run(store.updatePresenter(roomId, (p) => ({...p, revealStep: Number(body.step)})));
    case 'startTimer': {
      const minutes =
        body.minutes != null
          ? Number(body.minutes)
          : body.seconds != null
            ? Number(body.seconds) / 60
            : 5;
      return run(
        store.updatePresenter(roomId, (p) => ({
          ...p,
          timerStartedAt: new Date().toISOString(),
          timerMinutes: minutes,
          pauseUntil: null,
        })),
      );
    }
    case 'togglePlanB':
      return run(store.updatePresenter(roomId, (p) => ({...p, planB: !p.planB})));
    case 'pauseUntil':
      return run(store.updatePresenter(roomId, (p) => ({...p, pauseUntil: (body.until as string | null) ?? null})));
    case 'openLesson':
      return run(
        store.updatePresenter(roomId, (p) => ({
          ...p,
          lesson: String(body.lesson ?? ''),
          revision: body.revision == null ? p.revision : Number(body.revision),
          slideIndex: 0,
          revealStep: -1,
        })),
      );
    case 'everyoneBackToFollow': {
      const follows = await run(store.listFollows(roomId));
      const presenter = await run(store.getPresenter(roomId));
      let pulled = 0;
      for (const follow of follows) {
        if (!follow.following) {
          pulled += 1;
          await run(store.upsertFollow({...follow, following: true, ownIndex: presenter.slideIndex}));
        }
      }
      await run(store.publish(roomId, {type: 'everyoneBackToFollow', notice: NOTICE}));
      await run(store.publish(roomId, {type: 'notice', notice: NOTICE}));
      return {pulled, notice: NOTICE};
    }
    case 'detach': {
      const presenter = await run(store.getPresenter(roomId));
      const current = await run(store.getFollow(roomId, actor.id));
      return run(
        store.upsertFollow({
          ...current,
          displayName: actor.name,
          following: false,
          ownIndex: presenter.slideIndex,
        }),
      );
    }
    case 'followAgain': {
      const presenter = await run(store.getPresenter(roomId));
      const current = await run(store.getFollow(roomId, actor.id));
      return run(
        store.upsertFollow({
          ...current,
          displayName: actor.name,
          following: true,
          ownIndex: presenter.slideIndex,
          viewedRevision: presenter.revision,
        }),
      );
    }
    default:
      throw new Error(`unknown command ${command}`);
  }
};

const snapshotPayload = async (store: LiveStoreShape, roomId: string, participantId: string | null) => {
  const presenter = await run(store.getPresenter(roomId));
  const presence = await run(store.presence(roomId));
  const follow = participantId ? await run(store.getFollow(roomId, participantId)) : null;
  return {
    type: 'snapshot' as const,
    presenter,
    follow,
    presence,
    timerRemaining: timerRemainingSeconds(presenter),
  };
};

const writeSse = (res: ServerResponse, event: unknown): void => {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
};

/**
 * Attach `/live/:roomId/...` REST + SSE + WebSocket handlers to a Node HTTP server.
 * Returns true when the request was handled.
 */
/** Register WebSocket upgrade for `/live/:roomId/ws`. REST/SSE are handled via `handleLiveRequest` in the server's request listener. */
export const attachLiveHttp = (server: Server, store: LiveStoreShape): void => {
  const wss = new WebSocketServer({noServer: true});

  server.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const matched = matchLive(url);
      if (!matched || matched.rest !== 'ws') {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        void handleWs(store, matched.roomId, url, ws);
      });
    } catch {
      socket.destroy();
    }
  });
};

export const handleLiveRequest = async (
  store: LiveStoreShape,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (req.method === 'OPTIONS' && url.pathname.startsWith('/live/')) {
    sendJson(res, 204, {});
    return true;
  }
  const matched = matchLive(url);
  if (!matched) return false;

  const actor = {
    id: String(req.headers['x-participant-id'] ?? url.searchParams.get('participantId') ?? 'anonymous'),
    name: String(req.headers['x-participant-name'] ?? url.searchParams.get('name') ?? 'Guest'),
    role: (String(req.headers['x-role'] ?? url.searchParams.get('role') ?? 'participant') === 'facilitator'
      ? 'facilitator'
      : 'participant') as 'facilitator' | 'participant',
  };

  try {
    if (matched.rest === 'state' && req.method === 'GET') {
      sendJson(res, 200, await snapshotPayload(store, matched.roomId, actor.id));
      return true;
    }
    if (matched.rest === 'sse' && req.method === 'GET') {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
      });
      writeSse(res, await snapshotPayload(store, matched.roomId, actor.id));
      const fiber = Effect.runFork(
        Effect.scoped(
          Stream.runForEach(store.subscribe(matched.roomId), (event) =>
            Effect.sync(() => {
              if (event.type === 'presenter') {
                writeSse(res, {...event, timerRemaining: timerRemainingSeconds(event.state)});
              } else {
                writeSse(res, event);
              }
            }),
          ),
        ),
      );
      req.on('close', () => {
        Effect.runFork(Fiber.interrupt(fiber));
      });
      return true;
    }
    if (matched.rest.startsWith('command/') && req.method === 'POST') {
      const command = matched.rest.slice('command/'.length);
      const body = (await readJson(req)) as Record<string, unknown>;
      const result = await applyCommand(store, matched.roomId, command, body, actor);
      sendJson(res, 200, {ok: true, result});
      return true;
    }
    // Unknown /live/:room/(presenter|follow|projector) — let the SPA static handler serve index.html.
    return false;
  } catch (error) {
    sendJson(res, 400, {ok: false, error: error instanceof Error ? error.message : String(error)});
    return true;
  }
};

const handleWs = async (store: LiveStoreShape, roomId: string, url: URL, ws: WebSocket): Promise<void> => {
  const participantId = url.searchParams.get('participantId') ?? 'anonymous';
  const name = url.searchParams.get('name') ?? 'Guest';
  await run(
    store.upsertFollow({
      ...(await run(store.getFollow(roomId, participantId))),
      roomId,
      participantId,
      displayName: name,
      following: (await run(store.getFollow(roomId, participantId))).following ?? true,
      ownIndex: (await run(store.getPresenter(roomId))).slideIndex,
      lastSeenAt: new Date().toISOString(),
      viewedRevision: (await run(store.getFollow(roomId, participantId))).viewedRevision,
      evidenceSubmitted: (await run(store.getFollow(roomId, participantId))).evidenceSubmitted,
    }),
  );
  const send = (event: unknown) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(event));
  };
  send(await snapshotPayload(store, roomId, participantId));
  const fiber = Effect.runFork(
    Effect.scoped(
      Stream.runForEach(store.subscribe(roomId), (event: LiveEvent) =>
        Effect.sync(() => {
          if (event.type === 'presenter') {
            send({...event, timerRemaining: timerRemainingSeconds(event.state)});
          } else {
            send(event);
          }
        }),
      ),
    ),
  );
  ws.on('message', (raw) => {
    void (async () => {
      try {
        const msg = JSON.parse(String(raw)) as {command?: string; body?: Record<string, unknown>; role?: string};
        if (!msg.command) return;
        const result = await applyCommand(store, roomId, msg.command, msg.body ?? {}, {
          id: participantId,
          name,
          role: msg.role === 'facilitator' ? 'facilitator' : 'participant',
        });
        send({type: 'ack', command: msg.command, result});
      } catch (error) {
        send({type: 'error', error: error instanceof Error ? error.message : String(error)});
      }
    })();
  });
  ws.on('close', () => {
    Effect.runFork(Fiber.interrupt(fiber));
  });
};

export const enrichPresenter = (presenter: PresenterLiveState) => ({
  ...presenter,
  timerRemaining: timerRemainingSeconds(presenter),
});
