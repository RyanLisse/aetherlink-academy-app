import {NodeHttpServer} from '@effect/platform-node';
import {Effect, Layer, Schema} from 'effect';
import {HttpApiBuilder} from 'effect/unstable/httpapi';
import {HttpRouter} from 'effect/unstable/http';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {defineAction} from '../src/action.ts';
import {registry} from '../src/actions/index.ts';
import {ClassroomState, ClassroomStateLive} from '../src/actions/state.ts';
import {LivePresenter, type LivePresenterShape} from '../src/actions/live-state.ts';
import {toChatTools} from '../src/adapters/chat.ts';
import {ActionsHttpApi, ActionsHttpHandlers} from '../src/adapters/http.ts';
import {toMcpTools} from '../src/adapters/mcp.ts';
import {CallerResolver} from '../src/caller-resolver.ts';
import {ConfirmationStore, ConfirmationStoreLive} from '../src/confirmation.ts';
import {hashEncoded} from '../src/dispatcher.ts';
import {CallerResolutionFailed} from '../src/errors.ts';
import {emptyRegistry, registerAction} from '../src/registry.ts';

const PARTICIPANT_TOKEN = 'token-participant';
const FACILITATOR_TOKEN = 'token-facilitator';
const ROOM = 'room-1';

const CallerResolverFixture = Layer.succeed(CallerResolver, {
  resolve: (token: string) =>
    token === PARTICIPANT_TOKEN
      ? Effect.succeed({principalId: 'participant-1', roomId: ROOM, role: 'participant' as const})
      : token === FACILITATOR_TOKEN
        ? Effect.succeed({principalId: 'facilitator-1', roomId: ROOM, role: 'facilitator' as const})
        : Effect.fail(new CallerResolutionFailed({reason: 'unknown token'})),
});

/**
 * `ConfirmationStoreLive`/`ClassroomStateLive` build a fresh `Ref` every
 * time their `Layer` is built, and `Effect.provide` builds a layer fresh
 * per top-level run — so minting a token via one `Effect.provide(layer)`
 * call and dispatching via another builds two unrelated stores. Building
 * the services once here and wrapping them in `Layer.succeed` keeps the
 * same in-memory state shared between direct minting and the adapters,
 * matching how one real deployment shares one store across requests.
 */
const makeDependencies = () => {

const liveStub: LivePresenterShape = {
  roomId: ROOM,
  get: Effect.succeed({
    lesson: null,
    slideIndex: 0,
    revealStep: -1,
    timerStartedAt: null,
    timerMinutes: null,
    planB: false,
    pauseUntil: null,
    revision: null,
  }),
  nextSlide: Effect.succeed({slideIndex: 1, revealStep: -1}),
  prevSlide: Effect.succeed({slideIndex: 0, revealStep: -1}),
  gotoSlide: (index) => Effect.succeed({slideIndex: index, revealStep: -1}),
  setReveal: (step) => Effect.succeed({revealStep: step}),
  startTimer: (minutes) => Effect.succeed({timerStartedAt: new Date().toISOString(), timerMinutes: minutes}),
  togglePlanB: Effect.succeed({planB: true}),
  pauseUntil: (until) => Effect.succeed({pauseUntil: until}),
  openLesson: (lesson, revision = null) => Effect.succeed({lesson, revision: revision ?? null}),
  everyoneBackToFollow: Effect.succeed({pulled: 0}),
  detach: () => Effect.succeed({following: false}),
  followAgain: () => Effect.succeed({following: true}),
};

  const confirmationStore = Effect.runSync(Effect.provide(ConfirmationStore, ConfirmationStoreLive));
  const classroomState = Effect.runSync(Effect.provide(ClassroomState, ClassroomStateLive(ROOM)));
  const dependencies = Layer.mergeAll(
    CallerResolverFixture,
    Layer.succeed(ConfirmationStore, confirmationStore),
    Layer.succeed(ClassroomState, classroomState),
    Layer.succeed(LivePresenter, liveStub),
  );
  return {dependencies, confirmationStore};
};

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (disposers.length) await disposers.pop()!();
  vi.useRealTimers();
});

const httpRequestFor = (dependencies: Layer.Layer<CallerResolver | ConfirmationStore | ClassroomState | LivePresenter>, reg = registry) => {
  const app = HttpApiBuilder.layer(ActionsHttpApi(reg)).pipe(
    Layer.provide(ActionsHttpHandlers(reg)),
    Layer.provide(dependencies),
    Layer.provide(NodeHttpServer.layerHttpServices),
  );
  const web = HttpRouter.toWebHandler(app, {disableLogger: true});
  disposers.push(web.dispose);
  return (name: string, token: string, payload: unknown, confirmationToken?: string) =>
    web.handler(
      new Request(`http://actions.test/actions/${name}`, {
        method: 'POST',
        headers: {
          authorization: token,
          'content-type': 'application/json',
          accept: 'application/json',
          host: 'actions.test',
          ...(confirmationToken ? {'x-confirmation-token': confirmationToken} : {}),
        },
        body: JSON.stringify(payload),
      }),
    );
};

const mcpCallFor = (dependencies: Layer.Layer<CallerResolver | ConfirmationStore | ClassroomState | LivePresenter>, reg = registry) => {
  const tools = toMcpTools(reg);
  const runtime = <A>(effect: Effect.Effect<A, unknown, CallerResolver | ConfirmationStore | ClassroomState | LivePresenter>) =>
    Effect.runPromise(Effect.result(effect.pipe(Effect.provide(dependencies))));
  return (name: string, token: string, payload: unknown, confirmationToken?: string) => {
    const tool = tools.find((t) => t.name === name)!;
    return runtime(tool.call({token, payload, confirmationToken}));
  };
};

describe('HTTP and MCP agree for the same resolved caller', () => {
  test('a participant is denied the facilitator-only startTimer action via both adapters', async () => {
    const {dependencies} = makeDependencies();
    const http = httpRequestFor(dependencies);
    const httpResponse = await http('startTimer', PARTICIPANT_TOKEN, {seconds: 30});
    expect(httpResponse.status).toBe(403);
    expect(await httpResponse.json()).toMatchObject({tag: 'Forbidden'});

    const mcp = mcpCallFor(dependencies);
    const mcpResult = await mcp('startTimer', PARTICIPANT_TOKEN, {seconds: 30});
    expect(mcpResult._tag).toBe('Failure');
    if (mcpResult._tag === 'Failure') expect(mcpResult.failure).toMatchObject({_tag: 'ActionUnauthorized'});
  });

  test('a read action returns the same shape via both adapters', async () => {
    const {dependencies} = makeDependencies();
    const http = httpRequestFor(dependencies);
    const httpResponse = await http('getScreenState', PARTICIPANT_TOKEN, {});
    expect(httpResponse.status).toBe(200);
    expect(await httpResponse.json()).toEqual({screen: 'lobby'});

    const mcp = mcpCallFor(dependencies);
    const mcpResult = await mcp('getScreenState', PARTICIPANT_TOKEN, {});
    expect(mcpResult._tag).toBe('Success');
    if (mcpResult._tag === 'Success') {
      expect(mcpResult.success).toEqual({screen: 'lobby'});
    }
  });

  test('unknown payload fields (spoofed confirmed/role) are rejected identically by both adapters', async () => {
    const {dependencies} = makeDependencies();
    const http = httpRequestFor(dependencies);
    const httpResponse = await http('getScreenState', PARTICIPANT_TOKEN, {confirmed: true, role: 'facilitator'});
    expect(httpResponse.status).toBe(400);

    const mcp = mcpCallFor(dependencies);
    const mcpResult = await mcp('getScreenState', PARTICIPANT_TOKEN, {confirmed: true, role: 'facilitator'});
    expect(mcpResult._tag).toBe('Failure');
  });

  test('a facilitator with a real confirmation succeeds via HTTP, matching the MCP output shape', async () => {
    vi.useFakeTimers({toFake: ['Date']});
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'));
    const seconds = 45;

    const http = makeDependencies();
    const httpToken = await Effect.runPromise(
      http.confirmationStore.mint(
        {actionName: 'startTimer', payloadHash: hashEncoded({seconds}), principalId: 'facilitator-1', roomId: ROOM},
        60_000,
      ),
    );
    const httpResponse = await httpRequestFor(http.dependencies)('startTimer', FACILITATOR_TOKEN, {seconds}, httpToken);
    expect(httpResponse.status).toBe(200);
    const httpBody = (await httpResponse.json()) as {startedAt: string; seconds: number};
    expect(httpBody.seconds).toBe(seconds);
    expect(typeof httpBody.startedAt).toBe('string');

    const mcp = makeDependencies();
    const mcpToken = await Effect.runPromise(
      mcp.confirmationStore.mint({actionName: 'startTimer', payloadHash: hashEncoded({seconds}), principalId: 'facilitator-1', roomId: ROOM}, 60_000),
    );
    const mcpExit = await mcpCallFor(mcp.dependencies)('startTimer', FACILITATOR_TOKEN, {seconds}, mcpToken);
    expect(mcpExit._tag).toBe('Success');
    if (mcpExit._tag === 'Success') {
      expect(mcpExit.success).toEqual(httpBody);
    }
  });
});

describe('a transforming (Type !== Encoded) schema round-trips through both HTTP and MCP', () => {
  const doubleTransforming = defineAction({
    name: 'doubleTransforming',
    input: Schema.Struct({value: Schema.NumberFromString}),
    output: Schema.Struct({doubled: Schema.NumberFromString}),
    scope: 'both',
    intent: 'read',
    run: (input) => Effect.succeed({doubled: input.value * 2}),
  });
  const transformRegistry = registerAction(emptyRegistry, doubleTransforming);

  test('HTTP encodes the output exactly once', async () => {
    const {dependencies} = makeDependencies();
    const http = httpRequestFor(dependencies, transformRegistry);
    const response = await http('doubleTransforming', PARTICIPANT_TOKEN, {value: '21'});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({doubled: '42'});
  });

  test('MCP tools and chat tools produce the same encoded value', async () => {
    const {dependencies} = makeDependencies();
    const mcpTool = toMcpTools(transformRegistry)[0]!;
    const chatTool = toChatTools(transformRegistry)[0]!;
    const runtime = <A>(effect: Effect.Effect<A, unknown, CallerResolver | ConfirmationStore>) =>
      Effect.runPromise(effect.pipe(Effect.provide(dependencies)));
    const mcpResult = await runtime(mcpTool.call({token: PARTICIPANT_TOKEN, payload: {value: '21'}}));
    const chatResult = await runtime(chatTool.call({token: PARTICIPANT_TOKEN, payload: {value: '21'}}));
    expect(mcpResult).toEqual({doubled: '42'});
    expect(chatResult).toEqual({doubled: '42'});
  });
});
