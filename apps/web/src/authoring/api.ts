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
  headers.set('Authorization', `Bearer ${passphrase}`);
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
