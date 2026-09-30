import type {DeckSlide} from './Deck.js';

/** Presenter-chosen hidden slides, per browser. `hidden: true` in the source starts hidden; H flips it. */
const HIDDEN_KEY = 'academy-deck:hidden';
const SHOWN_KEY = 'academy-deck:shown';

const readSet = (key: string): Set<string> => {
  try { const raw = JSON.parse(localStorage.getItem(key) || '[]') as unknown; return new Set(Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : []); } catch { return new Set(); }
};
const writeSet = (key: string, set: Set<string>): void => {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* private mode */ }
};

export const isSlideHidden = (slide: DeckSlide): boolean => slide.hidden === true ? !readSet(SHOWN_KEY).has(slide.id) : readSet(HIDDEN_KEY).has(slide.id);

export const toggleSlideHidden = (slide: DeckSlide): boolean => {
  const now = !isSlideHidden(slide);
  const key = slide.hidden === true ? SHOWN_KEY : HIDDEN_KEY;
  const set = readSet(key);
  if ((slide.hidden === true) !== now) set.add(slide.id); else set.delete(slide.id);
  writeSet(key, set);
  return now;
};

export const isHiddenStorageKey = (key: string | null): boolean => key === HIDDEN_KEY || key === SHOWN_KEY;

/** First index from `start` stepping `dir` that is not hidden; null when there is none. */
export const visibleFrom = (slides: ReadonlyArray<DeckSlide>, start: number, dir: 1 | -1, hidden: (slide: DeckSlide) => boolean): number | null => {
  for (let i = start; i >= 0 && i < slides.length; i += dir) { const slide = slides[i]; if (slide && !hidden(slide)) return i; }
  return null;
};
