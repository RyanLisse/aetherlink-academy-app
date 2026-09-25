import {decodeSlide} from '@academy/schema';
import type {DeckSlide} from '@academy/deck';
import type {ReferenceDay} from '../reference/days.ts';

export interface ArchiveOrigin {
  readonly repo: string;
  readonly commit: string;
}

export interface ArchiveDeck extends ReferenceDay {
  readonly squad: number;
  readonly title: string;
  readonly guideUrl: string | null;
}

export interface ArchiveCatalog {
  readonly courseVersion: string;
  readonly origin: ArchiveOrigin;
  readonly decks: ReadonlyArray<ArchiveDeck>;
}

export type ArchivePage = {readonly kind: 'index'} | {readonly kind: 'deck'; readonly squad: number; readonly day: number};

export function matchArchive(pathname: string): ArchivePage | null {
  if (pathname === '/archive' || pathname === '/archive/') return {kind: 'index'};
  const match = /^\/archive\/squad-(\d+)\/day-(\d+)$/.exec(pathname);
  return match ? {kind: 'deck', squad: Number(match[1]), day: Number(match[2])} : null;
}

export const archiveDeckPath = (squad: number, day: number): string => `/archive/squad-${squad}/day-${day}`;

export const findArchiveDeck = (catalog: ArchiveCatalog, squad: number, day: number): ArchiveDeck | undefined =>
  catalog.decks.find((deck) => deck.squad === squad && deck.day === day);

interface RawArchive {
  readonly status: string;
  readonly courseVersion: string;
  readonly origin: ArchiveOrigin;
  readonly decks: ReadonlyArray<{
    readonly squad: number;
    readonly day: number;
    readonly lessonId: string;
    readonly title: string;
    readonly guideUrl: string | null;
    readonly slides: ReadonlyArray<{readonly slide: unknown}>;
  }>;
}

/** Parse the generated `content/archive/training-site.json`; every slide is decoded against the live Slide schema. */
export function parseArchive(raw: unknown): ArchiveCatalog {
  const archive = raw as RawArchive;
  if (archive?.status !== 'archived') throw new Error('training-site archive is not marked archived');
  return {
    courseVersion: archive.courseVersion,
    origin: archive.origin,
    decks: archive.decks.map((deck) => ({
      squad: deck.squad,
      day: deck.day,
      label: `Squad ${deck.squad} · Day ${deck.day}`,
      lessonId: deck.lessonId,
      title: deck.title,
      guideUrl: deck.guideUrl,
      slides: deck.slides.map((entry): DeckSlide => decodeSlide(entry.slide)),
    })),
  };
}

export const loadTrainingSiteArchive = async (): Promise<ArchiveCatalog> =>
  parseArchive((await import('../../../../content/archive/training-site.json', {with: {type: 'json'}})).default);
