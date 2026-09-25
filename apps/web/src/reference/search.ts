import type {SearchHit, SearchLocale} from '@academy/actions';
import type {DeckSlide} from '@academy/deck';
import {slideAnchor, type ReferenceDay} from './days.ts';

export type ReferenceSearch = (query: string, locale: SearchLocale) => Promise<ReadonlyArray<SearchHit>>;

/**
 * Participant-visible slide fields, mirroring the server's public field list
 * in `apps/server/src/search/documents.ts`. `notes` and `visual` are never read.
 */
const TEXT_FIELDS = ['kicker', 'subtitle', 'expected', 'check', 'prompt', 'tagline', 'planB', 'imageAlt', 'imageCaption'] as const;
const JSON_FIELDS = ['cards', 'items', 'columns', 'steps', 'concepts', 'bars'] as const;

const strings = (value: unknown): ReadonlyArray<string> => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
};

const fold = (value: string): string => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const words = (value: string): ReadonlyArray<string> => fold(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const bodyText = (slide: DeckSlide): string =>
  [...TEXT_FIELDS.flatMap((field) => strings(slide[field])), ...JSON_FIELDS.flatMap((field) => strings(slide[field]))].join(' ');

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Window around the first match, with matched words wrapped in `<mark>` like the server's ts_headline. */
const snippetOf = (text: string, tokens: ReadonlyArray<string>): string => {
  const folded = fold(text);
  const first = Math.min(...tokens.map((token) => folded.search(new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(token)}`, 'u'))).filter((index) => index >= 0));
  const start = Number.isFinite(first) ? Math.max(0, first - 60) : 0;
  const window = text.slice(start, start + 180);
  const marked = window.replace(/[\p{L}\p{N}]+/gu, (word) => (tokens.some((token) => fold(word).startsWith(token)) ? `<mark>${word}</mark>` : word));
  return `${start > 0 ? '… ' : ''}${marked}${start + 180 < text.length ? ' …' : ''}`;
};

/**
 * Offline fallback over the bundled decks: prefix word matching, every query
 * word required, title matches ranked higher. No stemming, so it is a weaker
 * stand-in for the server's `search_content` action, with the same hit shape.
 */
export const searchBundledDays = (days: ReadonlyArray<ReferenceDay>, query: string): ReadonlyArray<SearchHit> => {
  const tokens = words(query);
  if (tokens.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const day of days) {
    for (const slide of day.slides) {
      const titleWords = words(slide.title);
      const body = bodyText(slide);
      const bodyWords = words(body);
      const inTitle = (token: string) => titleWords.some((word) => word.startsWith(token));
      const inBody = (token: string) => bodyWords.some((word) => word.startsWith(token));
      if (!tokens.every((token) => inTitle(token) || inBody(token))) continue;
      const rank = tokens.reduce((sum, token) => sum + (inTitle(token) ? 1 : 0) + (inBody(token) ? 0.4 : 0), 0);
      hits.push({
        type: 'slide',
        day: day.day,
        lessonId: day.lessonId,
        lessonTitle: day.label,
        slideAnchor: slideAnchor(slide),
        title: slide.title,
        snippet: snippetOf(body || slide.title, tokens),
        rank,
      });
    }
  }
  return hits.sort((a, b) => b.rank - a.rank || (a.day ?? 0) - (b.day ?? 0)).slice(0, 50);
};

export const bundledSearch = (days: ReadonlyArray<ReferenceDay>): ReferenceSearch => async (query) => searchBundledDays(days, query);

/** Splits a `<mark>`-delimited snippet into text runs; never parsed as HTML. */
export const snippetRuns = (snippet: string): ReadonlyArray<{readonly text: string; readonly mark: boolean}> =>
  snippet
    .split(/(<mark>[\s\S]*?<\/mark>)/)
    .filter(Boolean)
    .map((part) => (part.startsWith('<mark>') && part.endsWith('</mark>') ? {text: part.slice(6, -7), mark: true} : {text: part, mark: false}));
