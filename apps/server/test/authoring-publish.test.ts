import {randomUUID} from 'node:crypto';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Effect, Layer} from 'effect';
import {HttpRouter} from 'effect/unstable/http';
import {decodeQuizQuestion, decodeSlide} from '@academy/schema';
import {afterEach, describe, expect, test} from 'vitest';
import {AuthoringLive, type AuthoringServices} from '../src/authoring/index.ts';
import {AUTHORED_VISUAL_KIND, aggregateHash, htmlToTextLines, lessonMarkdown, snapshotToSlides} from '../src/authoring/publish.ts';
import {FacilitatorAuth, FacilitatorAuthMemory, googleSsoFromEnv, type FacilitatorAuthShape} from '../src/identity/facilitator-auth.ts';
import {TokenService, TokenServiceLive} from '../src/identity/tokens.ts';
import {SquadStore, SquadStoreMemory} from '../src/squad/store.ts';

const UPSTREAM_ORIGIN = 'https://upstream-slides.invalid';
const API_KEY = 'authoring-host-key-should-never-leak';
const COURSE_ID = '6f1c0f7e-3b7a-4c55-9d7e-0c1f2a3b4c5d';
const CURRICULUM_LESSON_ID = '0a4b8c1d-2e3f-4a5b-8c6d-7e8f9a0b1c2d';

const dataDirs: Array<string> = [];
const disposers: Array<() => Promise<void>> = [];
const originalFetch = globalThis.fetch;
let upstreamCalls = 0;

afterEach(async () => {
  globalThis.fetch = originalFetch;
  upstreamCalls = 0;
  while (disposers.length) await disposers.pop()!();
  while (dataDirs.length) await rm(dataDirs.pop()!, {recursive: true, force: true});
});

/** Test double for the Slides upstream: counts calls, never reaches a network. */
const installCountingFetch = () => {
  globalThis.fetch = (async () => {
    upstreamCalls += 1;
    return {status: 500, text: async () => '{}'} as Response;
  }) as typeof fetch;
};

const envFor = async (overrides: NodeJS.ProcessEnv = {}): Promise<NodeJS.ProcessEnv> => {
  const dir = await mkdtemp(path.join(tmpdir(), 'academy-authoring-publish-test-'));
  dataDirs.push(dir);
  return {
    ACADEMY_AUTHORING_ENABLED: 'true',
    ACADEMY_AUTHORING_KEY: API_KEY,
    ACADEMY_AUTHORING_DATA_DIR: dir,
    AGENT_SLIDES_URL: UPSTREAM_ORIGIN,
    AGENT_SLIDES_TOKEN: 'upstream-token',
    ...overrides,
  };
};

const handlerFor = (env: NodeJS.ProcessEnv, services: AuthoringServices = {}) => {
  const web = HttpRouter.toWebHandler(AuthoringLive(env, services), {disableLogger: true});
  disposers.push(web.dispose);
  return (input: string, init?: RequestInit) => web.handler(new Request(`http://academy.test${input}`, init));
};

const facilitatorAuth = (): Promise<FacilitatorAuthShape> =>
  Effect.runPromise(Effect.gen(function* () {
    return yield* FacilitatorAuth;
  }).pipe(Effect.provide(FacilitatorAuthMemory(googleSsoFromEnv({})))));

/** Real participant credentials minted by the squad/token services, not hand-made strings. */
const participantTokens = () =>
  Effect.runPromise(Effect.gen(function* () {
    const squad = yield* SquadStore;
    const tokens = yield* TokenService;
    const room = yield* squad.create('Synthetic test squad', {slug: 'synthetic-test'});
    const joined = yield* squad.join(room.code, 'Synthetic participant');
    const session = yield* tokens.authenticate(joined.token, 'browser');
    const mcp = yield* tokens.mint(room.roomId, session.personId, 'mcp');
    return {roomHost: room.token, browser: joined.token, mcp};
  }).pipe(Effect.provide(TokenServiceLive.pipe(Layer.provideMerge(SquadStoreMemory())))));

const LESSON = 'lesson-1';
const ALL_ROUTES: ReadonlyArray<readonly [method: string, path: string]> = [
  ['GET', '/authoring-api/lessons'],
  ['POST', '/authoring-api/lessons'],
  ['POST', `/authoring-api/lessons/${LESSON}/deck`],
  ['POST', `/authoring-api/lessons/${LESSON}/refresh`],
  ['POST', `/authoring-api/lessons/${LESSON}/snapshot`],
  ['POST', `/authoring-api/lessons/${LESSON}/reconcile`],
  ['POST', `/authoring-api/lessons/${LESSON}/publish`],
  ['GET', `/authoring-api/courses/${COURSE_ID}/revisions`],
  ['GET', `/authoring-api/courses/${COURSE_ID}/revisions/1/lessons/${CURRICULUM_LESSON_ID}/markdown`],
];

const jsonInit = (method: string, headers: Record<string, string>): RequestInit => ({
  method,
  headers: {'content-type': 'application/json', ...headers},
  ...(method === 'POST' ? {body: JSON.stringify({title: 't', objective: 'o', outline: ['a'], deckId: 'd', courseId: COURSE_ID, curriculumLessonId: CURRICULUM_LESSON_ID})} : {}),
});

describe('authoring authorization (AET-25)', () => {
  test('participant browser, MCP and squad-room tokens get 401 on every /authoring-api route, as bearer and as cookie, and never reach upstream', async () => {
    installCountingFetch();
    const request = handlerFor(await envFor(), {facilitators: await facilitatorAuth()});
    const tokens = await participantTokens();
    const statuses: Array<string> = [];
    for (const token of [tokens.browser, tokens.mcp, tokens.roomHost]) {
      for (const [method, route] of ALL_ROUTES) {
        const asBearer = await request(route, jsonInit(method, {authorization: `Bearer ${token}`}));
        const asCookie = await request(route, jsonInit(method, {cookie: `academy-facilitator=${token}; academy-session=${token}`}));
        statuses.push(`${method} ${route} ${asBearer.status}/${asCookie.status}`);
        expect(await asBearer.text()).not.toContain(API_KEY);
      }
    }
    expect(statuses).toHaveLength(ALL_ROUTES.length * 3);
    expect(statuses.every((line) => line.endsWith(' 401/401'))).toBe(true);
    expect(upstreamCalls).toBe(0);
  });

  test('a Google SSO facilitator session authorizes via bearer and via the gateway cookie; logout revokes it', async () => {
    installCountingFetch();
    const facilitators = await facilitatorAuth();
    const token = await Effect.runPromise(facilitators.login({sub: 'synthetic-sub', email: 'facilitator@example.test', name: 'Synthetic Facilitator', domain: 'example.test'}));
    const request = handlerFor(await envFor(), {facilitators});
    expect((await request('/authoring-api/lessons', {headers: {authorization: `Bearer ${token}`}})).status).toBe(200);
    expect((await request('/authoring-api/lessons', {headers: {cookie: `other=1; academy-facilitator=${token}`}})).status).toBe(200);
    await Effect.runPromise(facilitators.logout(token));
    expect((await request('/authoring-api/lessons', {headers: {cookie: `academy-facilitator=${token}`}})).status).toBe(401);
  });

  test('without an SSO service only the host key authorizes (fail closed)', async () => {
    const request = handlerFor(await envFor());
    expect((await request('/authoring-api/lessons', {headers: {authorization: `Bearer ${API_KEY}`}})).status).toBe(200);
    expect((await request('/authoring-api/lessons', {headers: {cookie: `academy-facilitator=${API_KEY}`}})).status).toBe(401);
  });

  test('a cookie-authorized write without a JSON content type is refused (cross-site form CSRF)', async () => {
    const facilitators = await facilitatorAuth();
    const token = await Effect.runPromise(facilitators.login({sub: 's', email: 'facilitator@example.test', name: 'F', domain: 'example.test'}));
    const request = handlerFor(await envFor(), {facilitators});
    const form = await request('/authoring-api/lessons', {
      method: 'POST',
      headers: {cookie: `academy-facilitator=${token}`, 'content-type': 'application/x-www-form-urlencoded'},
      body: 'title=x',
    });
    expect(form.status).toBe(401);
    const json = await request('/authoring-api/lessons', {
      method: 'POST',
      headers: {cookie: `academy-facilitator=${token}`, 'content-type': 'application/json'},
      body: JSON.stringify({title: 'Synthetic', objective: 'Synthetic objective', outline: ['One']}),
    });
    expect(json.status).toBe(201);
  });

  test('with the flag off, publish and revision routes 404 even for the host key', async () => {
    const request = handlerFor(await envFor({ACADEMY_AUTHORING_ENABLED: 'false'}));
    for (const [method, route] of ALL_ROUTES) {
      expect((await request(route, jsonInit(method, {authorization: `Bearer ${API_KEY}`}))).status).toBe(404);
    }
  });

  test('without a curriculum store, publish/revisions/export answer 503 rather than pretending to publish', async () => {
    const request = handlerFor(await envFor());
    const auth = {authorization: `Bearer ${API_KEY}`};
    const created = await request('/authoring-api/lessons', jsonInit('POST', auth));
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    const publish = await request(`/authoring-api/lessons/${lesson.id}/publish`, jsonInit('POST', auth));
    expect(publish.status).toBe(503);
    expect(await publish.json()).toEqual({error: 'Curriculum store is not configured; publishing is unavailable.'});
    expect((await request(`/authoring-api/courses/${COURSE_ID}/revisions`, jsonInit('GET', auth))).status).toBe(503);
  });

  test('publish validates ids before touching the store', async () => {
    const request = handlerFor(await envFor(), {curriculum: {} as never});
    const auth = {authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json'};
    const bad = await request('/authoring-api/lessons/lesson-1/publish', {method: 'POST', headers: auth, body: JSON.stringify({courseId: 'nope', curriculumLessonId: CURRICULUM_LESSON_ID})});
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({error: 'courseId must be a UUID.'});
    const revisions = await request('/authoring-api/courses/not-a-uuid/revisions', {headers: auth});
    expect(revisions.status).toBe(400);
  });
});

describe('snapshot → curriculum slides mapping', () => {
  const snapshot = {
    revision: 'rev-abc',
    content: [
      {id: 'slide-1', content: '<div><h1>Welkom &amp; doel</h1><p>Wat je vandaag leert</p></div>', notes: 'Start met een vraag'},
      {id: 'slide-2', content: '<div><p>Geen kop hier</p><ul><li>Punt A</li><li>Punt B</li></ul></div>', notes: null},
      {id: 'slide-3', content: '<div style="x"></div>', notes: null},
    ],
  };

  test('derives titles from headings or text, keeps the HTML canonical, and reuses base slide ids by ordinal', () => {
    const baseId = randomUUID();
    const slides = snapshotToSlides(CURRICULUM_LESSON_ID, snapshot, [{id: baseId, ordinal: 1}]);
    expect(slides.map((slide) => [slide.ordinal, slide.title, slide.type])).toEqual([
      [1, 'Welkom & doel', 'context'],
      [2, 'Geen kop hier', 'concept'],
      [3, 'Slide 3', 'concept'],
    ]);
    expect(slides[0]!.id).toBe(baseId);
    expect(slides[0]!.notes).toBe('Start met een vraag');
    expect(slides[1]).not.toHaveProperty('notes');
    expect(slides[0]!.visual).toEqual({kind: AUTHORED_VISUAL_KIND, upstreamSlideId: 'slide-1', deckRevision: 'rev-abc', html: snapshot.content[0]!.content});
    expect(slides[1]!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(snapshotToSlides(CURRICULUM_LESSON_ID, snapshot, [])[1]!.id).toBe(slides[1]!.id);
    for (const slide of slides) expect(decodeSlide(slide).title).toBe(slide.title);
  });

  test('htmlToTextLines drops tags and scripts and splits on blocks', () => {
    expect(htmlToTextLines('<h2>Kop</h2><script>alert(1)</script><p>Een  <b>vet</b> woord</p>')).toEqual(['Kop', 'Een vet woord']);
  });

  test('aggregate hash ignores row order and key order', () => {
    const a = {tracks: [{id: 'b', ordinal: 2, name: {en: 'B'}}, {id: 'a', ordinal: 1, name: {en: 'A'}}], days: [], lessons: [], slides: [], assignments: [], quizQuestions: []};
    const b = {tracks: [{name: {en: 'A'}, ordinal: 1, id: 'a'}, {id: 'b', name: {en: 'B'}, ordinal: 2}], days: [], lessons: [], slides: [], assignments: [], quizQuestions: []};
    expect(aggregateHash(a as never)).toBe(aggregateHash(b as never));
    expect(aggregateHash(a as never)).not.toBe(aggregateHash({...a, tracks: [a.tracks[0]!]} as never));
  });

  test('lessonMarkdown renders authored and structured slides, notes and quiz answers', () => {
    const [authored] = snapshotToSlides(CURRICULUM_LESSON_ID, snapshot, []);
    const structured = decodeSlide({id: 's2', lessonId: CURRICULUM_LESSON_ID, ordinal: 2, title: 'Stappen', type: 'practice', steps: ['Open', 'Sluit'], prompt: 'Probeer het'});
    const markdown = lessonMarkdown(
      {courseId: COURSE_ID, version: 3, lessonId: CURRICULUM_LESSON_ID},
      {
        slides: [decodeSlide(authored), structured],
        quizQuestions: [decodeQuizQuestion({id: 'q1', lessonId: CURRICULUM_LESSON_ID, courseId: COURSE_ID, version: 3, question: {en: 'Which?', nl: 'Welke?'}, options: [{en: 'A'}, {en: 'B'}], answer: 1})],
      },
    );
    expect(markdown).toBe([
      `<!-- course ${COURSE_ID} · revision 3 · lesson ${CURRICULUM_LESSON_ID} -->`,
      '## 1. Welkom & doel',
      'Wat je vandaag leert',
      '**Facilitatornotities:** Start met een vraag',
      '## 2. Stappen',
      '1. Open\n2. Sluit',
      '> Probeer het',
      '## Quiz',
      '**Welke?**\n- [ ] A\n- [x] B',
    ].join('\n\n') + '\n');
  });
});
