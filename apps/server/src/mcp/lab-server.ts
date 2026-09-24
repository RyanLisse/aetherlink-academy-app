/**
 * In-process MCP lab server for AET-44 AC (documented fixture when no live Claude Code).
 * Streamable HTTP `/mcp` + HTTP denial parity + token revoke.
 * Uses AET-28 ReleaseStore.isReleased via ReleasePolicyFromStore (call only).
 */
import {createServer} from 'node:http';
import {Effect, Layer} from 'effect';
import {
  AcademyContent,
  AcademyContentMemory,
  CallerResolutionFailed,
  CallerResolver,
  ConfirmationStore,
  ConfirmationStoreLive,
  ParticipantContext,
  ParticipantContextMemory,
  ReleasePolicy,
  type AssignmentRecord,
  type LessonRecord,
} from '@academy/actions';
import {ReleasePolicyFromStore} from '../release/policy-layer.ts';
import {ReleaseStore, ReleaseStoreMemory} from '../release/store.ts';
import {attachMcpHttp, sendLockedLessonDenial} from './http.ts';
import {createAcademyMcpServer} from './tools.ts';

export interface LabFixture {
  readonly port: number;
  readonly host: string;
  readonly tokens: {readonly mcp: string; readonly revoked: string; readonly browser: string};
  readonly roomId: string;
  readonly participantId: string;
  readonly lessonId: string;
  readonly browserSlide: {readonly index: number; readonly title: string; readonly viewedRevision: number};
  readonly close: () => Promise<void>;
  readonly setView: (binding: {
    browserSessionId: string;
    slideIndex: number;
    viewedRevision: number | null;
    latestPublishedRevision: number | null;
    assignmentId?: string | null;
    route?: string | null;
    proofOpen?: boolean;
    proofSection?: string | null;
    quizId?: string | null;
    quizStatus?: string | null;
    quizItemIndex?: number | null;
    roomPhase?: string | null;
    releasedLessonIds?: ReadonlyArray<string> | null;
  }) => Promise<void>;
  readonly setReleased: (lessonId: string, released: boolean) => Promise<void>;
  readonly revokeMcp: () => void;
}

const DEMO_LESSON: LessonRecord = {
  id: 'lesson-day1-01',
  title: 'Day 1 · Foundations',
  day: 1,
  publishedRevision: 3,
  slides: [
    {id: 's0', index: 0, title: 'Welcome', body: 'Welcome to Academy.', assignmentId: null},
    {id: 's1', index: 1, title: 'First task', body: 'Open Claude Code.', assignmentId: 'asg-1'},
  ],
};

const DEMO_ASSIGNMENT: AssignmentRecord = {
  id: 'asg-1',
  lessonId: 'lesson-day1-01',
  title: 'Explore without changing',
  prompt: 'Inspect the starter repo read-only.',
  hints: ['Start with README.md', 'Then run git status'],
};

export const startMcpLab = async (opts?: {port?: number}): Promise<LabFixture> => {
  const roomId = 'room-lab-1';
  const participantId = 'participant-1';
  const lessonId = DEMO_LESSON.id;
  const mcpToken = 'mcp-live-token';
  const revokedToken = 'mcp-revoked-token';
  const browserToken = 'browser-token';
  const validMcp = new Set([mcpToken]);

  const store = await Effect.runPromise(Effect.provide(ReleaseStore, ReleaseStoreMemory()));
  await Effect.runPromise(
    store.seedSquad(roomId, [{lessonId, dayOrdinal: 1, lessonOrdinal: 1}], 'lab'),
  );
  // Ensure demo lesson released; seed already opens day-1 first lesson.
  await Effect.runPromise(store.releaseLesson(roomId, lessonId, 'lab'));

  const content = await Effect.runPromise(
    AcademyContentMemory({lessons: [DEMO_LESSON], assignments: [DEMO_ASSIGNMENT]}),
  );
  const ctx = await Effect.runPromise(ParticipantContextMemory());
  const confirmationStore = Effect.runSync(Effect.provide(ConfirmationStore, ConfirmationStoreLive));

  const callerLayer = Layer.succeed(CallerResolver, {
    resolve: (token: string) =>
      token === mcpToken && validMcp.has(token)
        ? Effect.succeed({principalId: participantId, roomId, role: 'participant' as const})
        : Effect.fail(new CallerResolutionFailed({reason: 'invalid or revoked mcp token'})),
  });

  const releaseLayer = ReleasePolicyFromStore.pipe(Layer.provide(Layer.succeed(ReleaseStore, store)));

  const dependencies = Layer.mergeAll(
    callerLayer,
    Layer.succeed(ConfirmationStore, confirmationStore),
    releaseLayer,
    Layer.succeed(AcademyContent, content),
    Layer.succeed(ParticipantContext, ctx),
  );

  await Effect.runPromise(
    ctx.upsert({
      browserSessionId: 'tab-1',
      roomId,
      participantId,
      lessonId,
      slideIndex: 1,
      slideId: 's1',
      viewedRevision: 2,
      latestPublishedRevision: 3,
      assignmentId: 'asg-1',
      route: '/workshop/lab',
      proofOpen: false,
      proofSection: null,
      quizId: null,
      quizStatus: null,
      quizItemIndex: null,
      roomPhase: 'solo',
      releasedLessonIds: [lessonId],
      updatedAt: Date.now(),
    }),
  );
  await Effect.runPromise(content.setConnectionState(roomId, participantId, 'verified'));

  const server = createServer((_req, res) => {
    res.writeHead(404);
    res.end('not found');
  });

  attachMcpHttp(server, {
    createServer: () => createAcademyMcpServer({dependencies: dependencies as never}),
    auth: {
      authenticate: (token) =>
        token && validMcp.has(token)
          ? Effect.succeed({roomId, personId: participantId})
          : Effect.fail({status: 401 as const, message: 'invalid mcp token'}),
    },
  });

  const mcpListeners = server.listeners('request').slice() as Array<
    (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void
  >;
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/http/lesson' && req.method === 'GET') {
      void (async () => {
        const id = url.searchParams.get('lessonId') || '';
        const released = await Effect.runPromise(store.isReleased(roomId, id));
        if (!released) {
          sendLockedLessonDenial(res);
          return;
        }
        res.writeHead(200, {'content-type': 'application/json'});
        res.end(JSON.stringify({id, ok: true}));
      })();
      return;
    }
    if (url.pathname === '/lab/revoke' && req.method === 'POST') {
      validMcp.delete(mcpToken);
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({revoked: true}));
      return;
    }
    if (url.pathname === '/lab/browser-view' && req.method === 'GET') {
      void (async () => {
        const active = await Effect.runPromise(ctx.listActive(roomId, participantId));
        const b = active[0];
        const slide = DEMO_LESSON.slides[b?.slideIndex ?? 0];
        res.writeHead(200, {'content-type': 'application/json'});
        res.end(
          JSON.stringify({
            lessonId: b?.lessonId ?? lessonId,
            route: b?.route ?? null,
            slideIndex: b?.slideIndex ?? 0,
            title: slide?.title ?? null,
            viewedRevision: b?.viewedRevision ?? null,
            latestPublishedRevision: b?.latestPublishedRevision ?? null,
            assignmentId: b?.assignmentId ?? null,
            proof: {
              open: Boolean(b?.proofOpen),
              section: b?.proofOpen ? (b?.proofSection ?? null) : null,
            },
            quiz: b?.quizId
              ? {
                  id: b.quizId,
                  status: b.quizStatus ?? null,
                  itemIndex: b.quizItemIndex ?? null,
                }
              : null,
            room: {
              id: roomId,
              phase: b?.roomPhase ?? null,
              releasedLessonIds: [...(b?.releasedLessonIds ?? [])],
            },
            browserSessionId: b?.browserSessionId ?? null,
          }),
        );
      })();
      return;
    }
    for (const listener of mcpListeners) listener(req, res);
  });

  const host = '127.0.0.1';
  const port = await new Promise<number>((resolve, reject) => {
    server.listen(opts?.port ?? 0, host, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') resolve(addr.port);
      else reject(new Error('no port'));
    });
  });

  return {
    port,
    host,
    tokens: {mcp: mcpToken, revoked: revokedToken, browser: browserToken},
    roomId,
    participantId,
    lessonId,
    browserSlide: {index: 1, title: 'First task', viewedRevision: 2},
    close: () => new Promise((r) => server.close(() => r())),
    setView: async (binding) => {
      await Effect.runPromise(
        ctx.upsert({
          browserSessionId: binding.browserSessionId,
          roomId,
          participantId,
          lessonId,
          slideIndex: binding.slideIndex,
          slideId: DEMO_LESSON.slides[binding.slideIndex]?.id ?? null,
          viewedRevision: binding.viewedRevision,
          latestPublishedRevision: binding.latestPublishedRevision,
          assignmentId: binding.assignmentId ?? 'asg-1',
          route: binding.route ?? '/workshop/lab',
          proofOpen: binding.proofOpen ?? false,
          proofSection: binding.proofSection ?? null,
          quizId: binding.quizId ?? null,
          quizStatus: binding.quizStatus ?? null,
          quizItemIndex: binding.quizItemIndex ?? null,
          roomPhase: binding.roomPhase ?? 'solo',
          releasedLessonIds: binding.releasedLessonIds ?? [lessonId],
          updatedAt: Date.now(),
        }),
      );
    },
    setReleased: async (id, released) => {
      if (released) {
        await Effect.runPromise(store.releaseLesson(roomId, id, 'lab'));
        return;
      }
      // Unreleased: ensure row is locked. Missing rows are already !isReleased.
      const exists = await Effect.runPromise(Effect.result(store.get(roomId, id)));
      if (exists._tag === 'Failure') return; // isReleased === false
      if (exists.success.state === 'scheduled') {
        await Effect.runPromise(store.cancelSchedule(roomId, id));
        return;
      }
      if (exists.success.state === 'released') {
        // No lock API on ReleaseStore — lab uses fresh never-seeded lesson IDs for denial tests.
        throw new Error('lab setReleased(false) does not demote an already-released lesson; use a fresh lessonId');
      }
    },
    revokeMcp: () => {
      validMcp.delete(mcpToken);
    },
  };
};
