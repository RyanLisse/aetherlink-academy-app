import {createHash, timingSafeEqual} from 'node:crypto';
import {Effect} from 'effect';
import {type HttpServerRequest, HttpServerResponse} from 'effect/unstable/http';
import type {AuthoringConfig} from './config.ts';
import {
  AuthoringConflict,
  AuthoringInvalid,
  AuthoringNotFound,
  AuthoringUnauthorized,
  DeckCreationBlocked,
  UpstreamContractError,
  UpstreamNotFound,
  UpstreamUnavailable,
  UpstreamUncertain,
} from './errors.ts';
import {CourseNotFound, RevisionNotDraft, RevisionNotFound, type CurriculumRepoShape} from '../db/curriculum-repo.ts';
import type {FacilitatorAuthShape} from '../identity/facilitator-auth.ts';
import {lessonMarkdown, publishSnapshot} from './publish.ts';
import type {AuthoringStore, DeckSummary, Lesson} from './store.ts';
import type {SlidesUpstream, UpstreamSlideInput} from './upstream.ts';

const MAX_TITLE_LENGTH = 200;
const MAX_OBJECTIVE_LENGTH = 2_000;
const MAX_OUTLINE_ITEMS = 100;
const MAX_OUTLINE_ITEM_LENGTH = 500;
const MAX_REQUEST_BODY_LENGTH = 512_000;
const MAX_DECK_ID_LENGTH = 200;
const LESSON_ID_PATTERN = /^[A-Za-z0-9-]{1,80}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REVISION_LENGTH = 200;
/** Same cookie the gateway sets after Google SSO (`server/app.mjs`). */
export const FACILITATOR_COOKIE = 'academy-facilitator';
/** Author recorded for revisions published with the shared host key rather than a personal SSO session. */
export const HOST_KEY_AUTHOR = 'host-key';

export interface AuthoringDeps {
  readonly config: AuthoringConfig;
  readonly store: AuthoringStore;
  readonly upstream: SlidesUpstream;
  /** Absent: publish, revision list and export answer 503 instead of pretending to publish. */
  readonly curriculum?: CurriculumRepoShape;
  /** Absent: only the host key authorizes. */
  readonly facilitators?: Pick<FacilitatorAuthShape, 'current'>;
}

/** Who is calling, resolved server-side. `via` matters for CSRF: a cookie rides along cross-site, a bearer header never does. */
interface Facilitator {
  readonly author: string;
  readonly via: 'host-key' | 'sso-bearer' | 'sso-cookie';
}

/** Constant-time regardless of input length: both sides are hashed to a fixed 32 bytes first. */
const timingSafeEqualStrings = (a: string, b: string): boolean => {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
};

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null;
  return /^Bearer (.+)$/.exec(header)?.[1] ?? null;
};

const readCookie = (header: string | undefined, name: string): string | null => {
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0 || part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim()) || null;
    } catch {
      return null;
    }
  }
  return null;
};

const HTML_ESCAPES: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

const SLIDE_ROOT_STYLE = 'box-sizing:border-box;width:100%;height:100%;padding:64px 80px;position:relative;overflow:hidden;background:#102a43;color:#f5f7fa;font-family:Inter,ui-sans-serif,system-ui,sans-serif;';
const buildDeckSlides = (lesson: Pick<Lesson, 'title' | 'objective' | 'outline'>): ReadonlyArray<UpstreamSlideInput> => [
  {
    id: 'slide-1',
    layout: 'title',
    content: `<div class="fmd-slide" style="${SLIDE_ROOT_STYLE}display:flex;flex-direction:column;justify-content:center;gap:24px;background:linear-gradient(135deg,#102a43 0%,#1f4e79 100%);"><div style="display:inline-block;align-self:flex-start;padding:8px 14px;border:1px solid #7dd3fc;border-radius:999px;color:#bae6fd;font-size:16px;letter-spacing:.08em;text-transform:uppercase;">AetherLink Academy · lesstart</div><h1 style="margin:0;max-width:820px;font-size:58px;line-height:1.05;letter-spacing:-.02em;color:#ffffff;">${escapeHtml(lesson.title)}</h1><p style="margin:0;max-width:760px;font-size:25px;line-height:1.35;color:#dbeafe;">${escapeHtml(lesson.objective)}</p><div style="width:120px;height:5px;border-radius:3px;background:#f59e0b;"></div><p style="margin:12px 0 0;color:#bfdbfe;font-size:16px;">Een helder vertrekpunt voor de facilitator</p></div>`,
  },
  ...lesson.outline.map((item, index): UpstreamSlideInput => ({
    id: `slide-${index + 2}`,
    layout: 'content',
    content: `<div class="fmd-slide" style="${SLIDE_ROOT_STYLE}display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:56px;align-items:center;background:#f8fafc;color:#102a43;"><div><div style="display:inline-flex;align-items:center;gap:10px;color:#1d4ed8;font-size:15px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;"><span style="display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#1d4ed8;color:#ffffff;font-size:16px;">${index + 1}</span> Onderdeel</div><h2 style="margin:24px 0 16px;font-size:44px;line-height:1.08;letter-spacing:-.02em;color:#102a43;">${escapeHtml(item)}</h2><p style="margin:0;max-width:660px;font-size:22px;line-height:1.45;color:#486581;">${escapeHtml(lesson.objective)}</p></div><div style="padding:28px;border-radius:20px;background:#102a43;color:#ffffff;box-shadow:0 18px 40px rgba(16,42,67,.18);"><p style="margin:0 0 12px;color:#fbbf24;font-size:14px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Lesroute</p><p style="margin:0;font-size:21px;line-height:1.3;">${index + 1} van ${lesson.outline.length}</p><div style="height:8px;margin-top:24px;border-radius:4px;background:#486581;"><div style="width:${Math.max(10, Math.round(((index + 1) / lesson.outline.length) * 100))}%;height:100%;border-radius:4px;background:#f59e0b;"></div></div></div></div>`,
  })),
];

const jsonResponse = (status: number, body: unknown) => HttpServerResponse.json(body, {status}).pipe(Effect.orDie);

const errorResponse = (status: number, message: string) => jsonResponse(status, {error: message});

const mapAuthoringError = (error: unknown) => {
  if (error instanceof AuthoringUnauthorized) return errorResponse(401, error.message);
  if (error instanceof AuthoringNotFound) return errorResponse(404, error.message);
  if (error instanceof CourseNotFound) return errorResponse(404, `Course ${error.courseId} was not found.`);
  if (error instanceof RevisionNotFound) return errorResponse(404, `Course ${error.courseId} has no revision ${error.version}.`);
  if (error instanceof RevisionNotDraft) return errorResponse(409, `Course ${error.courseId} revision ${error.version} is already published.`);
  if (error instanceof CurriculumUnavailable) return errorResponse(503, error.message);
  if (error instanceof AuthoringInvalid) return errorResponse(400, error.message);
  if (error instanceof AuthoringConflict) return errorResponse(409, error.message);
  if (error instanceof DeckCreationBlocked) return errorResponse(409, error.message);
  if (error instanceof UpstreamUnavailable || error instanceof UpstreamContractError || error instanceof UpstreamNotFound) {
    return errorResponse(502, error.message);
  }
  if (error instanceof UpstreamUncertain) return errorResponse(504, error.message);
  return errorResponse(500, 'Internal authoring error.');
};

const readJsonBody = (request: HttpServerRequest.HttpServerRequest) =>
  request.text.pipe(
    Effect.flatMap((text) => {
      if (Buffer.byteLength(text, 'utf8') > MAX_REQUEST_BODY_LENGTH) {
        return Effect.fail(new AuthoringInvalid({message: 'Request body is too large.'}));
      }
      try {
        return Effect.succeed(JSON.parse(text) as unknown);
      } catch {
        return Effect.fail(new AuthoringInvalid({message: 'Request body must be valid JSON.'}));
      }
    }),
    Effect.mapError((error) => error instanceof AuthoringInvalid ? error : new AuthoringInvalid({message: 'Request body must be valid JSON.'})),
  );

const validateLessonInput = (body: unknown) =>
  Effect.gen(function* () {
    if (!body || typeof body !== 'object') {
      return yield* Effect.fail(new AuthoringInvalid({message: 'Request body must be a JSON object.'}));
    }
    const record = body as Record<string, unknown>;
    let bodyLength = 0;
    try {
      bodyLength = JSON.stringify(body).length;
    } catch {
      return yield* Effect.fail(new AuthoringInvalid({message: 'Request body must be serializable JSON.'}));
    }
    if (bodyLength > MAX_REQUEST_BODY_LENGTH) {
      return yield* Effect.fail(new AuthoringInvalid({message: 'Request body is too large.'}));
    }
    const title = record.title;
    const objective = record.objective;
    const outline = record.outline;
    if (typeof title !== 'string' || !title.trim() || title.length > MAX_TITLE_LENGTH) {
      return yield* Effect.fail(new AuthoringInvalid({message: `title must be a non-empty string up to ${MAX_TITLE_LENGTH} characters.`}));
    }
    if (typeof objective !== 'string' || !objective.trim() || objective.length > MAX_OBJECTIVE_LENGTH) {
      return yield* Effect.fail(new AuthoringInvalid({message: `objective must be a non-empty string up to ${MAX_OBJECTIVE_LENGTH} characters.`}));
    }
    if (
      !Array.isArray(outline) ||
      outline.length === 0 ||
      outline.length > MAX_OUTLINE_ITEMS ||
      !outline.every((item) => typeof item === 'string' && item.trim() && item.length <= MAX_OUTLINE_ITEM_LENGTH)
    ) {
      return yield* Effect.fail(
        new AuthoringInvalid({
          message: `outline must be a non-empty array of up to ${MAX_OUTLINE_ITEMS} strings, each up to ${MAX_OUTLINE_ITEM_LENGTH} characters.`,
        }),
      );
    }
    return {
      title: title.trim(),
      objective: objective.trim(),
      outline: (outline as ReadonlyArray<string>).map((item) => item.trim()),
    };
  });

class CurriculumUnavailable extends Error {}

const validateUuid = (value: unknown, field: string) =>
  typeof value === 'string' && UUID_PATTERN.test(value)
    ? Effect.succeed(value.toLowerCase())
    : Effect.fail(new AuthoringInvalid({message: `${field} must be a UUID.`}));

const validateLessonId = (id: string) =>
  LESSON_ID_PATTERN.test(id) ? Effect.succeed(id) : Effect.fail(new AuthoringInvalid({message: 'Malformed lesson id.'}));

const toDeckSummary = (deck: {id: string; url: string; title: string; slideCount: number; revision: string}): DeckSummary => ({
  id: deck.id,
  url: deck.url,
  title: deck.title,
  slideCount: deck.slideCount,
  revision: deck.revision,
});

export const createAuthoringHandler = ({config, store, upstream, curriculum, facilitators}: AuthoringDeps) => {
  /**
   * Facilitator-only, fail closed: the shared host key, or a live Google SSO
   * facilitator session (bearer or the gateway's cookie). Anything else —
   * participant browser/MCP tokens included — is 401. The author is always
   * derived here, never from the request body.
   */
  const requireFacilitator = (request: HttpServerRequest.HttpServerRequest) =>
    Effect.gen(function* () {
      const bearer = extractBearerToken(request.headers['authorization']);
      if (bearer && timingSafeEqualStrings(bearer, config.apiKey)) return {author: HOST_KEY_AUTHOR, via: 'host-key'} satisfies Facilitator;
      if (facilitators) {
        if (bearer) {
          const session = yield* facilitators.current(bearer);
          if (session) return {author: session.email, via: 'sso-bearer'} satisfies Facilitator;
        }
        const cookie = readCookie(request.headers['cookie'], FACILITATOR_COOKIE);
        if (cookie) {
          const session = yield* facilitators.current(cookie);
          if (session) return {author: session.email, via: 'sso-cookie'} satisfies Facilitator;
        }
      }
      return yield* Effect.fail(new AuthoringUnauthorized({message: 'Facilitator authorization required.'}));
    });

  /** A cross-site form can carry the cookie but cannot set a JSON content type without a CORS preflight. */
  const requireJsonForCookieWrites = (request: HttpServerRequest.HttpServerRequest, facilitator: Facilitator) =>
    facilitator.via === 'sso-cookie' && request.method !== 'GET' && !(request.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')
      ? Effect.fail(new AuthoringUnauthorized({message: 'Cookie-authorized writes must send Content-Type: application/json.'}))
      : Effect.void;

  const requireCurriculum = curriculum
    ? Effect.succeed(curriculum)
    : Effect.fail(new CurriculumUnavailable('Curriculum store is not configured; publishing is unavailable.'));

  const listLessons = Effect.gen(function* () {
    const lessons = yield* Effect.tryPromise({try: () => store.listLessons(), catch: (error) => error});
    return yield* jsonResponse(200, {lessons});
  });

  const createLesson = (request: HttpServerRequest.HttpServerRequest) =>
    Effect.gen(function* () {
      const body = yield* readJsonBody(request);
      const input = yield* validateLessonInput(body);
      const lesson = yield* Effect.tryPromise({try: () => store.createLesson(input), catch: (error) => error});
      return yield* jsonResponse(201, {lesson});
    });

  const createDeck = (lessonId: string) =>
    Effect.gen(function* () {
      const id = yield* validateLessonId(lessonId);
      const result = yield* Effect.tryPromise({
        try: () =>
          store.ensureDeck(id, async (lesson) => {
            const deck = await upstream.createDeck({title: lesson.title, slides: buildDeckSlides(lesson)});
            return toDeckSummary(deck);
          }),
        catch: (error) => error,
      });
      if (!result) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      return yield* jsonResponse(result.created ? 201 : 200, {lesson: result.lesson});
    });

  const refreshDeck = (lessonId: string) =>
    Effect.gen(function* () {
      const id = yield* validateLessonId(lessonId);
      const lesson = yield* Effect.tryPromise({try: () => store.getLesson(id), catch: (error) => error});
      if (!lesson) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      if (!lesson.deck) return yield* Effect.fail(new AuthoringConflict({message: `Lesson ${id} has no deck yet; create one first.`}));
      const deck = yield* Effect.tryPromise({try: () => upstream.getDeck(lesson.deck!.id, {compact: false}), catch: (error) => error});
      const updated = yield* Effect.tryPromise({
        try: () => store.updateDeckSummary(id, toDeckSummary(deck)),
        catch: (error) => error,
      });
      if (!updated) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      return yield* jsonResponse(200, {lesson: updated});
    });

  const snapshotDeck = (lessonId: string) =>
    Effect.gen(function* () {
      const id = yield* validateLessonId(lessonId);
      const lesson = yield* Effect.tryPromise({try: () => store.getLesson(id), catch: (error) => error});
      if (!lesson) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      if (!lesson.deck) return yield* Effect.fail(new AuthoringConflict({message: `Lesson ${id} has no deck yet; create one first.`}));
      const deck = yield* Effect.tryPromise({try: () => upstream.getDeck(lesson.deck!.id, {compact: false}), catch: (error) => error});
      const updated = yield* Effect.tryPromise({
        try: () =>
          store.saveSnapshot(
            id,
            {title: deck.title, slideCount: deck.slideCount, revision: deck.revision, capturedAt: new Date().toISOString()},
            deck.slides,
          ),
        catch: (error) => error,
      });
      if (!updated) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      return yield* jsonResponse(200, {lesson: updated});
    });

  const reconcileDeck = (lessonId: string, request: HttpServerRequest.HttpServerRequest) =>
    Effect.gen(function* () {
      const id = yield* validateLessonId(lessonId);
      const body = yield* readJsonBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return yield* Effect.fail(new AuthoringInvalid({message: 'Request body must be a JSON object.'}));
      }
      const deckIdValue = (body as Record<string, unknown>).deckId;
      if (typeof deckIdValue !== 'string' || !deckIdValue.trim() || deckIdValue.length > MAX_DECK_ID_LENGTH) {
        return yield* Effect.fail(new AuthoringInvalid({message: `deckId must be a non-empty string up to ${MAX_DECK_ID_LENGTH} characters.`}));
      }
      const deckId = deckIdValue.trim();
      // Resolve first, without holding the local write mutex. The upstream
      // client only addresses the configured Slides origin and reads the full
      // canonical deck; no URL supplied by the operator is followed.
      const deck = yield* Effect.tryPromise({try: () => upstream.getDeck(deckId, {compact: false}), catch: (error) => error});
      if (deck.id !== deckId) {
        return yield* Effect.fail(new UpstreamContractError({message: 'Upstream returned a different deck id during reconciliation.'}));
      }
      const result = yield* Effect.tryPromise({
        try: () => store.reconcileDeck(id, toDeckSummary(deck)),
        catch: (error) => error,
      });
      if (!result) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      if (!result.attached) {
        return yield* Effect.fail(new AuthoringConflict({message: `Lesson ${id} has no unresolved deck creation to reconcile, or already has a deck.`}));
      }
      return yield* jsonResponse(200, {lesson: result.lesson});
    });

  const publishLesson = (lessonId: string, request: HttpServerRequest.HttpServerRequest, facilitator: Facilitator) =>
    Effect.gen(function* () {
      const id = yield* validateLessonId(lessonId);
      const repo = yield* requireCurriculum;
      const body = yield* readJsonBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return yield* Effect.fail(new AuthoringInvalid({message: 'Request body must be a JSON object.'}));
      }
      const record = body as Record<string, unknown>;
      const courseId = yield* validateUuid(record.courseId, 'courseId');
      const curriculumLessonId = yield* validateUuid(record.curriculumLessonId, 'curriculumLessonId');
      const revision = record.snapshotRevision;
      if (revision !== undefined && (typeof revision !== 'string' || !revision || revision.length > MAX_REVISION_LENGTH)) {
        return yield* Effect.fail(new AuthoringInvalid({message: `snapshotRevision must be a non-empty string up to ${MAX_REVISION_LENGTH} characters.`}));
      }
      const found = yield* Effect.tryPromise({try: () => store.getSnapshot(id, revision as string | undefined), catch: (error) => error});
      if (!found) return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${id} was not found.`}));
      if (!found.snapshot) {
        return yield* Effect.fail(new AuthoringConflict({
          message: revision === undefined ? `Lesson ${id} has no snapshot yet; save one first.` : `Lesson ${id} has no snapshot with revision ${revision}.`,
        }));
      }
      const result = yield* publishSnapshot(repo, {courseId, curriculumLessonId, snapshot: found.snapshot, author: facilitator.author});
      return yield* jsonResponse(result.unchanged ? 200 : 201, {publication: {...result, courseId, curriculumLessonId, snapshotRevision: found.snapshot.revision}});
    });

  const listRevisions = (courseIdValue: string) =>
    Effect.gen(function* () {
      const courseId = yield* validateUuid(courseIdValue, 'courseId');
      const repo = yield* requireCurriculum;
      const currentVersion = yield* repo.currentVersion(courseId);
      const revisions = yield* repo.listRevisions(courseId);
      return yield* jsonResponse(200, {
        courseId,
        currentVersion,
        revisions: revisions.map((revision) => ({
          version: revision.version,
          status: revision.status,
          createdBy: revision.createdBy,
          publishedBy: revision.publishedBy,
          createdAt: new Date(revision.createdAt).toISOString(),
          publishedAt: revision.publishedAt ? new Date(revision.publishedAt).toISOString() : null,
        })),
      });
    });

  const exportMarkdown = (courseIdValue: string, versionValue: string, lessonIdValue: string) =>
    Effect.gen(function* () {
      const courseId = yield* validateUuid(courseIdValue, 'courseId');
      const lessonId = yield* validateUuid(lessonIdValue, 'lessonId');
      const version = Number(versionValue);
      if (!Number.isSafeInteger(version) || version < 1) return yield* Effect.fail(new AuthoringInvalid({message: 'version must be a positive integer.'}));
      const repo = yield* requireCurriculum;
      const lesson = yield* repo.readLessonFacilitator(lessonId, courseId, version);
      if (lesson.slides.length === 0 && lesson.quizQuestions.length === 0) {
        return yield* Effect.fail(new AuthoringNotFound({message: `Lesson ${lessonId} has no content in course ${courseId} revision ${version}.`}));
      }
      return HttpServerResponse.text(lessonMarkdown({courseId, version, lessonId}, lesson), {
        status: 200,
        contentType: 'text/markdown; charset=utf-8',
        headers: {'content-disposition': `attachment; filename="lesson-${lessonId}-v${version}.md"`},
      });
    });

  return (request: HttpServerRequest.HttpServerRequest) =>
    Effect.gen(function* () {
      const facilitator = yield* requireFacilitator(request);
      yield* requireJsonForCookieWrites(request, facilitator);
      const url = new URL(request.url, 'http://authoring.local');
      const pathname = url.pathname;
      if (request.method === 'GET' && pathname === '/authoring-api/lessons') return yield* listLessons;
      if (request.method === 'POST' && pathname === '/authoring-api/lessons') return yield* createLesson(request);
      const deckMatch = /^\/authoring-api\/lessons\/([^/]+)\/deck$/.exec(pathname);
      if (request.method === 'POST' && deckMatch) return yield* createDeck(decodeURIComponent(deckMatch[1]!));
      const refreshMatch = /^\/authoring-api\/lessons\/([^/]+)\/refresh$/.exec(pathname);
      if (request.method === 'POST' && refreshMatch) return yield* refreshDeck(decodeURIComponent(refreshMatch[1]!));
      const snapshotMatch = /^\/authoring-api\/lessons\/([^/]+)\/snapshot$/.exec(pathname);
      if (request.method === 'POST' && snapshotMatch) return yield* snapshotDeck(decodeURIComponent(snapshotMatch[1]!));
      const reconcileMatch = /^\/authoring-api\/lessons\/([^/]+)\/reconcile$/.exec(pathname);
      if (request.method === 'POST' && reconcileMatch) return yield* reconcileDeck(decodeURIComponent(reconcileMatch[1]!), request);
      const publishMatch = /^\/authoring-api\/lessons\/([^/]+)\/publish$/.exec(pathname);
      if (request.method === 'POST' && publishMatch) return yield* publishLesson(decodeURIComponent(publishMatch[1]!), request, facilitator);
      const revisionsMatch = /^\/authoring-api\/courses\/([^/]+)\/revisions$/.exec(pathname);
      if (request.method === 'GET' && revisionsMatch) return yield* listRevisions(decodeURIComponent(revisionsMatch[1]!));
      const markdownMatch = /^\/authoring-api\/courses\/([^/]+)\/revisions\/([^/]+)\/lessons\/([^/]+)\/markdown$/.exec(pathname);
      if (request.method === 'GET' && markdownMatch) {
        return yield* exportMarkdown(decodeURIComponent(markdownMatch[1]!), decodeURIComponent(markdownMatch[2]!), decodeURIComponent(markdownMatch[3]!));
      }
      return yield* errorResponse(404, 'Not found.');
    }).pipe(Effect.matchEffect({onFailure: mapAuthoringError, onSuccess: Effect.succeed}));
};
