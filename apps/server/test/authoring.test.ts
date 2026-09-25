import {randomUUID} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {HttpRouter} from 'effect/unstable/http';
import {afterEach, describe, expect, test} from 'vitest';
import {AuthoringLive} from '../src/authoring/index.ts';

const UPSTREAM_ORIGIN = 'https://upstream-slides.invalid';
const UPSTREAM_TOKEN = 'upstream-secret-token-should-never-leak';
const API_KEY = 'authoring-poc-key-should-never-leak';

const dataDirs: Array<string> = [];
const disposers: Array<() => Promise<void>> = [];
const originalFetch = globalThis.fetch;

afterEach(async () => {
  globalThis.fetch = originalFetch;
  while (disposers.length) await disposers.pop()!();
  while (dataDirs.length) await rm(dataDirs.pop()!, {recursive: true, force: true});
});

const makeDataDir = async (): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), 'academy-authoring-test-'));
  dataDirs.push(dir);
  return dir;
};

const baseEnv = (dataDir: string): NodeJS.ProcessEnv => ({
  ACADEMY_AUTHORING_ENABLED: 'true',
  ACADEMY_AUTHORING_KEY: API_KEY,
  ACADEMY_AUTHORING_DATA_DIR: dataDir,
  AGENT_SLIDES_URL: UPSTREAM_ORIGIN,
  AGENT_SLIDES_TOKEN: UPSTREAM_TOKEN,
});

const handlerFor = (env: NodeJS.ProcessEnv) => {
  const app = AuthoringLive(env);
  const web = HttpRouter.toWebHandler(app, {disableLogger: true});
  disposers.push(web.dispose);
  return (input: string, init?: RequestInit) => web.handler(new Request(`http://academy.test${input}`, init));
};

const authed = (init?: RequestInit): RequestInit => ({
  ...init,
  headers: {...(init?.headers ?? {}), authorization: `Bearer ${API_KEY}`},
});

interface FakeUpstreamCall {
  readonly url: string;
  readonly method: string;
  readonly authorization: string | null;
}

const upstreamDeckJson = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'deck-fixture-1',
  title: 'Fixture deck',
  slideCount: 2,
  url: `${UPSTREAM_ORIGIN}/deck-fixture-1`,
  appUrl: `${UPSTREAM_ORIGIN}/deck-fixture-1`,
  slides: [
    {id: 'slide-1', content: '<h1>Fixture</h1>', notes: null},
    {id: 'slide-2', content: '<h2>Outline</h2>', notes: null},
  ],
  ...overrides,
});

const installFakeFetch = (
  respond: (call: FakeUpstreamCall, body: unknown) => {status: number; json: unknown} | {status: number; redirect: true},
): {calls: Array<FakeUpstreamCall>} => {
  const calls: Array<FakeUpstreamCall> = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers = new Headers(init?.headers);
    const call: FakeUpstreamCall = {url, method: init?.method ?? 'GET', authorization: headers.get('authorization')};
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push(call);
    const result = respond(call, body);
    if ('redirect' in result) {
      return {status: result.status, text: async () => ''} as Response;
    }
    return {status: result.status, text: async () => JSON.stringify(result.json)} as Response;
  }) as typeof fetch;
  return {calls};
};

describe('authoring PoC: gating', () => {
  test('rejects non-loopback plaintext upstreams but allows loopback development', async () => {
    const dir = await makeDataDir();
    const remote = handlerFor({...baseEnv(dir), AGENT_SLIDES_URL: 'http://slides.example.com'});
    expect((await remote('/authoring-api/lessons', authed())).status).toBe(404);
    const local = handlerFor({...baseEnv(dir), AGENT_SLIDES_URL: 'http://127.0.0.1:5190'});
    expect((await local('/authoring-api/lessons', authed())).status).toBe(200);
  });

  test('mounts no routes when ACADEMY_AUTHORING_ENABLED is not "true"', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor({...baseEnv(dataDir), ACADEMY_AUTHORING_ENABLED: 'false'});
    const response = await request('/authoring-api/lessons', authed());
    expect(response.status).toBe(404);
  });

  test('mounts no routes when required config is missing (fails closed)', async () => {
    const dataDir = await makeDataDir();
    const env = baseEnv(dataDir);
    delete env.ACADEMY_AUTHORING_KEY;
    const request = handlerFor(env);
    const response = await request('/authoring-api/lessons', authed());
    expect(response.status).toBe(404);
  });
});

describe('authoring PoC: auth', () => {
  test('rejects requests with no Authorization header', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const response = await request('/authoring-api/lessons');
    expect(response.status).toBe(401);
    const body = await response.text();
    expect(body).not.toContain(API_KEY);
  });

  test('rejects requests with a wrong bearer token and never echoes the configured key', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const response = await request('/authoring-api/lessons', {headers: {authorization: 'Bearer wrong-token'}});
    expect(response.status).toBe(401);
    const body = await response.text();
    expect(body).not.toContain(API_KEY);
  });

  test('accepts the exact configured key', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const response = await request('/authoring-api/lessons', authed());
    expect(response.status).toBe(200);
  });

  test('reconcile inherits the authoring bearer-token gate', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const response = await request('/authoring-api/lessons/lesson-1/reconcile', {
      method: 'POST',
      body: JSON.stringify({deckId: 'deck-fixture-1'}),
    });
    expect(response.status).toBe(401);
  });
});

describe('authoring PoC: lesson persistence', () => {
  test('creates a lesson and reads it back with deck/snapshot null', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const created = await request(
      '/authoring-api/lessons',
      authed({method: 'POST', body: JSON.stringify({title: 'Intro to Underwriting', objective: 'Explain the basics', outline: ['What is underwriting', 'Risk factors']})}),
    );
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {lesson: {id: string}};
    expect(createdBody.lesson).toMatchObject({
      title: 'Intro to Underwriting',
      objective: 'Explain the basics',
      outline: ['What is underwriting', 'Risk factors'],
      deck: null,
      snapshot: null,
    });

    const listed = await request('/authoring-api/lessons', authed());
    expect(listed.status).toBe(200);
    const listedBody = (await listed.json()) as {lessons: Array<{id: string}>};
    expect(listedBody.lessons.map((lesson) => lesson.id)).toContain(createdBody.lesson.id);
  });

  test('rejects invalid input without crashing', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const missingTitle = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({objective: 'x', outline: ['a']})}));
    expect(missingTitle.status).toBe(400);

    const emptyOutline = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: []})}));
    expect(emptyOutline.status).toBe(400);

    const notJson = await request('/authoring-api/lessons', authed({method: 'POST', body: '{not json'}));
    expect(notJson.status).toBe(400);
  });

  test('unknown lesson id 404s on deck/refresh/snapshot', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const missingId = randomUUID();
    for (const suffix of ['deck', 'refresh', 'snapshot']) {
      const response = await request(`/authoring-api/lessons/${missingId}/${suffix}`, authed({method: 'POST'}));
      expect(response.status).toBe(404);
    }
  });
});

describe('authoring PoC: deck creation against the real upstream contract', () => {
  const createLesson = async (request: ReturnType<typeof handlerFor>) => {
    const response = await request(
      '/authoring-api/lessons',
      authed({method: 'POST', body: JSON.stringify({title: 'Claims 101', objective: 'Cover the basics', outline: ['Filing a claim', 'Adjuster review']})}),
    );
    const body = (await response.json()) as {lesson: {id: string}};
    return body.lesson.id;
  };

  test('creates a deterministic, explicit-text deck via the documented create-deck contract', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);

    const {calls} = installFakeFetch((call, body) => {
      if (call.method === 'POST') {
        expect(call.url).toBe(`${UPSTREAM_ORIGIN}/_agent-native/actions/create-deck`);
        expect(call.authorization).toBe(`Bearer ${UPSTREAM_TOKEN}`);
        const slides = (body as {slides: Array<{id: string; content: string; layout?: string}>}).slides;
        expect(slides.length).toBe(3); // title slide + 2 outline items
        expect(slides[0]!.content).toContain('Claims 101');
        expect(slides[0]!.content).toContain('class="fmd-slide"');
        expect(slides[0]!.content).toContain('AetherLink Academy');
        // create-deck may return the compact MCP shape; HTML is canonicalized
        // by the subsequent get-deck compact=false readback.
        return {status: 200, json: upstreamDeckJson({slideCount: slides.length, slides: slides.map((slide) => ({id: slide.id, layout: slide.layout, textPreview: 'compact'}))})};
      }
      expect(call.url).toContain('/_agent-native/actions/get-deck?');
      expect(call.url).toContain('compact=false');
      return {status: 200, json: upstreamDeckJson({slideCount: 3})};
    });

    const response = await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(response.status).toBe(201);
    const body = (await response.json()) as {lesson: {deck: {id: string; url: string; slideCount: number}}};
    expect(body.lesson.deck).toMatchObject({id: 'deck-fixture-1', url: `${UPSTREAM_ORIGIN}/deck-fixture-1`, slideCount: 3});
    expect(calls.length).toBe(2); // create, then canonical full-content readback
  });

  test('an existing deck is returned unchanged, never overwritten', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);
    installFakeFetch(() => ({status: 200, json: upstreamDeckJson()}));
    await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));

    const {calls} = installFakeFetch(() => ({status: 200, json: upstreamDeckJson({id: 'should-not-be-used'})}));
    const second = await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(second.status).toBe(200);
    const body = (await second.json()) as {lesson: {deck: {id: string}}};
    expect(body.lesson.deck.id).toBe('deck-fixture-1');
    expect(calls.length).toBe(0);
  });

  test('two concurrent deck-create calls collapse into exactly one upstream create', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);

    let inFlight = 0;
    let maxInFlight = 0;
    const {calls} = installFakeFetch(() => ({status: 200, json: upstreamDeckJson()}));
    const originalFetchImpl = globalThis.fetch;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 20));
      const result = await originalFetchImpl(...args);
      inFlight -= 1;
      return result;
    }) as typeof fetch;

    const [first, second] = await Promise.all([
      request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'})),
      request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'})),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 201]);
    expect(calls.length).toBe(2); // one create plus its canonical readback
    expect(maxInFlight).toBe(1);

    const raw = JSON.parse(await readFile(path.join(dataDir, 'lessons.json'), 'utf8')) as {lessons: Record<string, {deck: {id: string}}>};
    expect(raw.lessons[lessonId]!.deck.id).toBe('deck-fixture-1');
  });

  test('fails closed on a redirect instead of following it', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);
    installFakeFetch(() => ({status: 302, redirect: true}));
    const response = await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).not.toContain(UPSTREAM_TOKEN);
  });

  test('fails closed when the editor URL origin does not match the configured upstream', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);
    installFakeFetch(() => ({status: 200, json: upstreamDeckJson({url: 'http://attacker.invalid/deck-fixture-1', appUrl: 'http://attacker.invalid/deck-fixture-1'})}));
    const response = await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(response.status).toBe(502);
  });

  test('fails closed on a malformed 2xx payload instead of faking success', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);
    installFakeFetch(() => ({status: 200, json: {ok: true}}));
    const response = await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(response.status).toBe(502);
    const restarted = handlerFor(baseEnv(dataDir));
    const retry = await restarted(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(retry.status).toBe(409);
  });

  test('an upstream 500 is reported as an error, without leaking the upstream token', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLesson(request);
    installFakeFetch(() => ({status: 500, json: {message: 'boom'}}));
    const response = await request(`/authoring-api/lessons/${lessonId}/deck`, authed({method: 'POST'}));
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).not.toContain(UPSTREAM_TOKEN);
  });
});

describe('authoring PoC: refresh and snapshot', () => {
  const createLessonWithDeck = async (request: ReturnType<typeof handlerFor>) => {
    const created = await request(
      '/authoring-api/lessons',
      authed({method: 'POST', body: JSON.stringify({title: 'Policy Renewals', objective: 'Explain renewal steps', outline: ['Notice period', 'Rate changes']})}),
    );
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    installFakeFetch(() => ({status: 200, json: upstreamDeckJson()}));
    await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}));
    return lesson.id;
  };

  test('refresh pulls the actual upstream deck and updates the summary', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLessonWithDeck(request);

    installFakeFetch((call) => {
      expect(call.url).toContain('/_agent-native/actions/get-deck?');
      expect(call.method).toBe('GET');
      return {status: 200, json: upstreamDeckJson({title: 'Policy Renewals (edited upstream)', slideCount: 5})};
    });
    const response = await request(`/authoring-api/lessons/${lessonId}/refresh`, authed({method: 'POST'}));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {lesson: {deck: {title: string; slideCount: number}}};
    expect(body.lesson.deck).toMatchObject({title: 'Policy Renewals (edited upstream)', slideCount: 5});
  });

  test('refresh without an existing deck is a conflict, not a fake deck', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const created = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: ['A']})}));
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    const response = await request(`/authoring-api/lessons/${lesson.id}/refresh`, authed({method: 'POST'}));
    expect(response.status).toBe(409);
  });

  test('snapshot stores full content on disk but the API response is a summary only', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLessonWithDeck(request);

    installFakeFetch((call) => {
      expect(call.url).toContain('compact=false');
      return {
        status: 200,
        json: upstreamDeckJson({
          slides: [
            {id: 'slide-1', content: '<h1>Full secret slide content</h1>', notes: 'speaker notes here'},
            {id: 'slide-2', content: '<h2>More content</h2>', notes: null},
          ],
        }),
      };
    });
    const response = await request(`/authoring-api/lessons/${lessonId}/snapshot`, authed({method: 'POST'}));
    expect(response.status).toBe(200);
    const bodyText = await response.text();
    expect(bodyText).not.toContain('Full secret slide content');
    const body = JSON.parse(bodyText) as {lesson: {snapshot: {title: string; slideCount: number; revision: string; capturedAt: string}}};
    expect(body.lesson.snapshot).toMatchObject({title: 'Fixture deck', slideCount: 2});
    expect(typeof body.lesson.snapshot.revision).toBe('string');
    expect(Number.isNaN(Date.parse(body.lesson.snapshot.capturedAt))).toBe(false);

    const raw = JSON.parse(await readFile(path.join(dataDir, 'lessons.json'), 'utf8')) as {
      lessons: Record<string, {snapshotContent: Array<{content: string}>}>;
    };
    expect(raw.lessons[lessonId]!.snapshotContent[0]!.content).toContain('Full secret slide content');
  });

  test('snapshot fails closed on an upstream 404 instead of storing an empty snapshot', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLessonWithDeck(request);
    installFakeFetch(() => ({status: 404, json: {message: 'deck gone'}}));
    const response = await request(`/authoring-api/lessons/${lessonId}/snapshot`, authed({method: 'POST'}));
    expect(response.status).toBe(502);
  });

  test('snapshot history keeps each immutable full-content revision', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const lessonId = await createLessonWithDeck(request);
    let revision = 0;
    installFakeFetch(() => {
      revision += 1;
      return {
        status: 200,
        json: upstreamDeckJson({
          revision: `rev-${revision}`,
          slides: [{id: 'slide-1', content: `<div>Revision ${revision}</div>`, notes: null}],
          slideCount: 1,
        }),
      };
    });
    expect((await request(`/authoring-api/lessons/${lessonId}/snapshot`, authed({method: 'POST'}))).status).toBe(200);
    expect((await request(`/authoring-api/lessons/${lessonId}/snapshot`, authed({method: 'POST'}))).status).toBe(200);

    const raw = JSON.parse(await readFile(path.join(dataDir, 'lessons.json'), 'utf8')) as {
      lessons: Record<string, {snapshotHistory: Array<{revision: string; content: Array<{content: string}>}>}>;
    };
    expect(raw.lessons[lessonId]!.snapshotHistory).toHaveLength(2);
    expect(raw.lessons[lessonId]!.snapshotHistory[0]!.content[0]!.content).toContain('Revision 1');
    expect(raw.lessons[lessonId]!.snapshotHistory[1]!.content[0]!.content).toContain('Revision 2');
  });
});

describe('authoring PoC: upstream timeout is reported as uncertain, never auto-retried', () => {
  test('an AbortSignal.timeout style abort surfaces as 504, not a silent retry', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor({...baseEnv(dataDir), ACADEMY_AUTHORING_UPSTREAM_TIMEOUT_MS: '10'});
    const created = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: ['A']})}));
    const {lesson} = (await created.json()) as {lesson: {id: string}};

    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return await new Promise<Response>((_resolve, reject) => {
        setTimeout(() => reject(new DOMException('The operation timed out.', 'TimeoutError')), 5);
      });
    }) as typeof fetch;

    const response = await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}));
    expect(response.status).toBe(504);
    expect(calls).toBe(1);

    const retry = await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}));
    expect(retry.status).toBe(409);
    expect(calls).toBe(1);

    const raw = JSON.parse(await readFile(path.join(dataDir, 'lessons.json'), 'utf8')) as {
      lessons: Record<string, {deck: unknown; deckCreation: {status: string}}>;
    };
    expect(raw.lessons[lesson.id]!.deck).toBeNull();
    expect(raw.lessons[lesson.id]!.deckCreation.status).toBe('uncertain');
  });

  test('reconcile rejects a lesson without a pending or uncertain creation fence', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const created = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: ['A']})}));
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    const {calls} = installFakeFetch((call) => {
      expect(call.method).toBe('GET');
      return {status: 200, json: upstreamDeckJson()};
    });

    const response = await request(`/authoring-api/lessons/${lesson.id}/reconcile`, authed({method: 'POST', body: JSON.stringify({deckId: 'deck-fixture-1'})}));
    expect(response.status).toBe(409);
    expect(calls).toHaveLength(1);
    const raw = JSON.parse(await readFile(path.join(dataDir, 'lessons.json'), 'utf8')) as {
      lessons: Record<string, {deck: unknown; deckCreation: unknown}>;
    };
    expect(raw.lessons[lesson.id]!.deck).toBeNull();
    expect(raw.lessons[lesson.id]!.deckCreation).toBeNull();
  });

  test('reconcile reads the full upstream deck and atomically clears an uncertain fence', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor({...baseEnv(dataDir), ACADEMY_AUTHORING_UPSTREAM_TIMEOUT_MS: '10'});
    const created = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: ['A']})}));
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    globalThis.fetch = (async () => await new Promise<Response>((_resolve, reject) => {
      setTimeout(() => reject(new DOMException('The operation timed out.', 'TimeoutError')), 5);
    })) as typeof fetch;
    expect((await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}))).status).toBe(504);

    const {calls} = installFakeFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/_agent-native/actions/get-deck?');
      expect(call.url).toContain('compact=false');
      return {status: 200, json: upstreamDeckJson()};
    });
    const response = await request(`/authoring-api/lessons/${lesson.id}/reconcile`, authed({method: 'POST', body: JSON.stringify({deckId: 'deck-fixture-1'})}));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {lesson: {deck: {id: string}; deckCreation: unknown}};
    expect(body.lesson.deck).toMatchObject({id: 'deck-fixture-1'});
    expect(body.lesson.deckCreation).toBeNull();
    expect(calls).toHaveLength(1);

    const retry = await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}));
    expect(retry.status).toBe(200);
    expect(calls).toHaveLength(1);
  });

  test('an unknown upstream deck leaves the uncertain fence intact and does not enable retry', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor({...baseEnv(dataDir), ACADEMY_AUTHORING_UPSTREAM_TIMEOUT_MS: '10'});
    const created = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: ['A']})}));
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    globalThis.fetch = (async () => await new Promise<Response>((_resolve, reject) => {
      setTimeout(() => reject(new DOMException('The operation timed out.', 'TimeoutError')), 5);
    })) as typeof fetch;
    expect((await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}))).status).toBe(504);

    const {calls} = installFakeFetch((call) => {
      expect(call.method).toBe('GET');
      return {status: 404, json: {message: 'deck gone'}};
    });
    const response = await request(`/authoring-api/lessons/${lesson.id}/reconcile`, authed({method: 'POST', body: JSON.stringify({deckId: 'deck-fixture-1'})}));
    expect(response.status).toBe(502);
    expect(calls).toHaveLength(1);

    const retry = await request(`/authoring-api/lessons/${lesson.id}/deck`, authed({method: 'POST'}));
    expect(retry.status).toBe(409);
    expect(calls).toHaveLength(1);
    const raw = JSON.parse(await readFile(path.join(dataDir, 'lessons.json'), 'utf8')) as {
      lessons: Record<string, {deck: unknown; deckCreation: {status: string}}>;
    };
    expect(raw.lessons[lesson.id]!.deck).toBeNull();
    expect(raw.lessons[lesson.id]!.deckCreation.status).toBe('uncertain');
  });

  test('reconcile rejects an overlong deck id before contacting upstream', async () => {
    const dataDir = await makeDataDir();
    const request = handlerFor(baseEnv(dataDir));
    const created = await request('/authoring-api/lessons', authed({method: 'POST', body: JSON.stringify({title: 'T', objective: 'O', outline: ['A']})}));
    const {lesson} = (await created.json()) as {lesson: {id: string}};
    const {calls} = installFakeFetch(() => ({status: 500, json: {}}));
    const response = await request(`/authoring-api/lessons/${lesson.id}/reconcile`, authed({method: 'POST', body: JSON.stringify({deckId: 'd'.repeat(201)})}));
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});
