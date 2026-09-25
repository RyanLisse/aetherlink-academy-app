export interface LessonDeck {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly slideCount: number;
  readonly revision: string | number;
}

export interface LessonSnapshot {
  readonly title: string;
  readonly slideCount: number;
  readonly revision: string | number;
  readonly capturedAt: string;
}

export interface LessonDeckCreation {
  readonly status: 'pending' | 'uncertain';
  readonly startedAt: string;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly outline: readonly string[];
  readonly deck: LessonDeck | null;
  readonly deckCreation: LessonDeckCreation | null;
  readonly snapshot: LessonSnapshot | null;
}

interface ErrorPayload {
  readonly error?: unknown;
}

interface LessonPayload {
  readonly lesson?: unknown;
}

interface LessonsPayload {
  readonly lessons?: unknown;
}

const API_ROOT = '/authoring-api';

export class AuthoringApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthoringApiError';
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`Ongeldige ${field} in serverantwoord`);
  return value;
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Ongeldige ${field} in serverantwoord`);
  return value;
}

function revision(value: unknown): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value;
  throw new Error('Ongeldige revisie in serverantwoord');
}

function parseDeck(value: unknown): LessonDeck | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error('Ongeldige deck in serverantwoord');
  return {
    id: requiredString(value.id, 'deck-id'),
    url: requiredString(value.url, 'deck-url'),
    title: requiredString(value.title, 'deck-titel'),
    slideCount: requiredNumber(value.slideCount, 'aantal slides'),
    revision: revision(value.revision),
  };
}

function parseSnapshot(value: unknown): LessonSnapshot | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error('Ongeldige snapshot in serverantwoord');
  return {
    title: requiredString(value.title, 'snapshot-titel'),
    slideCount: requiredNumber(value.slideCount, 'snapshot-aantal slides'),
    revision: revision(value.revision),
    capturedAt: requiredString(value.capturedAt, 'snapshot-tijdstip'),
  };
}

function parseDeckCreation(value: unknown): LessonDeckCreation | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw new Error('Ongeldige deckaanmaakstatus in serverantwoord');
  const status = value.status;
  if (status !== 'pending' && status !== 'uncertain') throw new Error('Ongeldige deckaanmaakstatus in serverantwoord');
  return {
    status,
    startedAt: requiredString(value.startedAt, 'starttijd deckaanmaak'),
  };
}

export function parseLesson(value: unknown): Lesson {
  if (!isRecord(value)) throw new Error('Ongeldige les in serverantwoord');
  if (!Array.isArray(value.outline) || !value.outline.every((item) => typeof item === 'string')) {
    throw new Error('Ongeldige outline in serverantwoord');
  }
  return {
    id: requiredString(value.id, 'les-id'),
    title: requiredString(value.title, 'les-titel'),
    objective: requiredString(value.objective, 'lesdoel'),
    outline: value.outline,
    deck: parseDeck(value.deck),
    deckCreation: parseDeckCreation(value.deckCreation),
    snapshot: parseSnapshot(value.snapshot),
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function serverError(payload: unknown, status: number): AuthoringApiError {
  const message = isRecord(payload) && typeof payload.error === 'string' ? payload.error : `Verzoek mislukt (HTTP ${status})`;
  return new AuthoringApiError(message, status);
}

async function request<T>(passphrase: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  // Empty passphrase: rely on the facilitator's Google SSO cookie instead of the shared host key.
  if (passphrase.trim()) headers.set('Authorization', `Bearer ${passphrase.trim()}`);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_ROOT}${path}`, {...init, headers});
  const payload = await readJson(response);
  if (!response.ok) throw serverError(payload, response.status);
  return payload as T;
}

export async function listLessons(passphrase: string): Promise<readonly Lesson[]> {
  const payload = await request<LessonsPayload>(passphrase, '/lessons');
  if (!isRecord(payload) || !Array.isArray(payload.lessons)) throw new Error('Ongeldige lessenlijst in serverantwoord');
  return payload.lessons.map(parseLesson);
}

export async function createLesson(passphrase: string, input: {title: string; objective: string; outline: readonly string[]}): Promise<Lesson> {
  const payload = await request<LessonPayload>(passphrase, '/lessons', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!isRecord(payload) || payload.lesson === undefined) throw new Error('Ongeldige nieuwe les in serverantwoord');
  return parseLesson(payload.lesson);
}

export async function createDeck(passphrase: string, lessonId: string): Promise<Lesson> {
  return lessonAction(passphrase, lessonId, 'deck');
}

export async function reconcileDeck(passphrase: string, lessonId: string, deckId: string): Promise<Lesson> {
  const payload = await request<LessonPayload>(passphrase, `/lessons/${encodeURIComponent(lessonId)}/reconcile`, {
    method: 'POST',
    body: JSON.stringify({deckId}),
  });
  if (!isRecord(payload) || payload.lesson === undefined) throw new Error('Ongeldige les in serverantwoord');
  return parseLesson(payload.lesson);
}

export async function refreshFromSlides(passphrase: string, lessonId: string): Promise<Lesson> {
  return lessonAction(passphrase, lessonId, 'refresh');
}

export async function saveSnapshot(passphrase: string, lessonId: string): Promise<Lesson> {
  return lessonAction(passphrase, lessonId, 'snapshot');
}

async function lessonAction(passphrase: string, lessonId: string, action: 'deck' | 'refresh' | 'snapshot'): Promise<Lesson> {
  const payload = await request<LessonPayload>(passphrase, `/lessons/${encodeURIComponent(lessonId)}/${action}`, {method: 'POST'});
  if (!isRecord(payload) || payload.lesson === undefined) throw new Error('Ongeldige les in serverantwoord');
  return parseLesson(payload.lesson);
}

export interface Revision {
  readonly version: number;
  readonly status: 'draft' | 'published';
  readonly createdBy: string | null;
  readonly publishedBy: string | null;
  readonly createdAt: string;
  readonly publishedAt: string | null;
}

export interface RevisionList {
  readonly courseId: string;
  readonly currentVersion: number | null;
  readonly revisions: readonly Revision[];
}

export interface Publication {
  readonly version: number;
  readonly baseVersion: number;
  readonly unchanged: boolean;
  readonly publishedBy: string | null;
  readonly publishedAt: string | null;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requiredString(value, field);
}

function parseRevision(value: unknown): Revision {
  if (!isRecord(value)) throw new Error('Ongeldige revisie in serverantwoord');
  const status = value.status;
  if (status !== 'draft' && status !== 'published') throw new Error('Ongeldige revisiestatus in serverantwoord');
  return {
    version: requiredNumber(value.version, 'versie'),
    status,
    createdBy: nullableString(value.createdBy, 'maker'),
    publishedBy: nullableString(value.publishedBy, 'publicist'),
    createdAt: requiredString(value.createdAt, 'aanmaaktijd'),
    publishedAt: nullableString(value.publishedAt, 'publicatietijd'),
  };
}

export async function listRevisions(passphrase: string, courseId: string): Promise<RevisionList> {
  const payload = await request<unknown>(passphrase, `/courses/${encodeURIComponent(courseId)}/revisions`);
  if (!isRecord(payload) || !Array.isArray(payload.revisions)) throw new Error('Ongeldige revisielijst in serverantwoord');
  const current = payload.currentVersion;
  return {
    courseId: requiredString(payload.courseId, 'cursus-id'),
    currentVersion: current === null ? null : requiredNumber(current, 'huidige versie'),
    revisions: payload.revisions.map(parseRevision),
  };
}

export async function publishSnapshot(passphrase: string, lessonId: string, target: {courseId: string; curriculumLessonId: string}): Promise<Publication> {
  const payload = await request<unknown>(passphrase, `/lessons/${encodeURIComponent(lessonId)}/publish`, {
    method: 'POST',
    body: JSON.stringify(target),
  });
  if (!isRecord(payload) || !isRecord(payload.publication)) throw new Error('Ongeldige publicatie in serverantwoord');
  const publication = payload.publication;
  if (typeof publication.unchanged !== 'boolean') throw new Error('Ongeldige publicatie in serverantwoord');
  return {
    version: requiredNumber(publication.version, 'versie'),
    baseVersion: requiredNumber(publication.baseVersion, 'basisversie'),
    unchanged: publication.unchanged,
    publishedBy: nullableString(publication.publishedBy, 'publicist'),
    publishedAt: nullableString(publication.publishedAt, 'publicatietijd'),
  };
}

export async function exportMarkdown(passphrase: string, courseId: string, version: number, lessonId: string): Promise<string> {
  const headers = new Headers({Accept: 'text/markdown'});
  if (passphrase.trim()) headers.set('Authorization', `Bearer ${passphrase.trim()}`);
  const response = await fetch(`${API_ROOT}/courses/${encodeURIComponent(courseId)}/revisions/${version}/lessons/${encodeURIComponent(lessonId)}/markdown`, {headers});
  if (!response.ok) throw serverError(await readJson(response), response.status);
  return response.text();
}
