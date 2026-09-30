import {decodeSlide} from '@academy/schema';
import type {DeckSlide} from '@academy/deck';

/** `/game/decks/:id` slide as the gateway returns it (server/slides/actions.ts fullSlide). */
export interface RoomDeckSlide {
  readonly id: string;
  readonly kind: 'classroom' | 'html';
  readonly textPreview: string;
  readonly notes?: string;
  readonly classroom?: Record<string, unknown>;
}

export interface RoomDeck {
  readonly id: string;
  readonly title: string;
  readonly revision: number;
  readonly slides: ReadonlyArray<RoomDeckSlide>;
}

const DECK_PATH = /^\/decks\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

/** Room deck id for `/decks/:deckId`, or null. */
export function matchRoomDeck(pathname: string): string | null {
  return DECK_PATH.exec(pathname)?.[1] ?? null;
}

const defaultType = (layout: unknown) => layout === 'exercise' ? 'practice' : layout === 'recap' ? 'recap' : 'context';

/** HTML-only slides have no structure; present their text as a title slide so the deck stays in order. */
const htmlSlide = (slide: RoomDeckSlide): Record<string, unknown> => {
  const [title = '', ...rest] = slide.textPreview.split(/(?<=[.!?:])\s+/);
  return {title: title || '—', ...(rest.length ? {subtitle: rest.join(' ')} : {})};
};

/** Map a room deck onto the classroom renderer's slide contract. */
export function roomDeckSlides(deck: RoomDeck): ReadonlyArray<DeckSlide> {
  return deck.slides.map((slide, index) => {
    const source = slide.classroom ?? htmlSlide(slide);
    const decoded = decodeSlide({
      ...source,
      id: slide.id,
      lessonId: 'room-deck',
      ordinal: index + 1,
      type: source.type ?? defaultType(source.layout),
      ...(slide.notes ? {notes: slide.notes} : {}),
    });
    return {...source, ...decoded};
  });
}

export type RoomDeckFetcher = (deckId: string) => Promise<RoomDeck>;

export const fetchRoomDeck: RoomDeckFetcher = async (deckId) => {
  let token: string | null = null;
  try { token = sessionStorage.getItem('academy-token'); } catch { /* storage blocked */ }
  const response = await fetch(`/game/decks/${encodeURIComponent(deckId)}`, {
    credentials: 'same-origin',
    headers: token ? {authorization: `Bearer ${token}`} : {},
  });
  const body = await response.json().catch(() => null) as {error?: string} | RoomDeck | null;
  if (!response.ok) throw new Error(body && 'error' in body && body.error ? body.error : `HTTP ${response.status}`);
  return body as RoomDeck;
};
