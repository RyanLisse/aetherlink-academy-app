import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import type {Slide} from '@academy/schema';
import {contentHashSlides} from './contentHash.ts';
import {decodeDayDecks} from './dayDecksJson.ts';

export class TrainingSiteArchiveError extends Error {
  readonly _tag = 'TrainingSiteArchiveError';
  constructor(message: string) {
    super(message);
    this.name = 'TrainingSiteArchiveError';
  }
}

export type Squad = 1 | 2;

/** Where one training-site registry lives: `dist/days.js` assigns `window.DAYS`, `dist/squad2.js` assigns `window.SQUAD2`. */
export interface TrainingSiteRegistry {
  readonly squad: Squad;
  readonly global: string;
  readonly path: string;
}

export const TRAINING_SITE_REGISTRIES: ReadonlyArray<TrainingSiteRegistry> = [
  {squad: 1, global: 'DAYS', path: 'dist/days.js'},
  {squad: 2, global: 'SQUAD2', path: 'dist/squad2.js'},
];

export interface ArchiveOrigin {
  readonly repo: string;
  readonly commit: string;
}

export interface SlideProvenance extends ArchiveOrigin {
  readonly path: string;
  /** Location inside the registry, e.g. `DAYS.day3.slides[4]`. */
  readonly pointer: string;
}

export interface ArchivedSlide {
  readonly slide: Slide;
  readonly source: SlideProvenance;
}

export interface ArchivedDeck {
  readonly squad: Squad;
  readonly day: number;
  readonly lessonId: string;
  readonly title: string;
  readonly guideUrl: string | null;
  readonly slides: ReadonlyArray<ArchivedSlide>;
}

export interface TrainingSiteArchive {
  readonly status: 'archived';
  readonly courseVersion: string;
  readonly origin: ArchiveOrigin;
  readonly slideCount: number;
  readonly contentHash: string;
  readonly decks: ReadonlyArray<ArchivedDeck>;
}

const loadRegistry = (checkoutDir: string, registry: TrainingSiteRegistry): Record<string, unknown> => {
  const file = path.join(checkoutDir, registry.path);
  const context: {window: Record<string, unknown>} = {window: {}};
  vm.createContext(context);
  try {
    vm.runInContext(readFileSync(file, 'utf8'), context, {filename: file, timeout: 5_000});
  } catch (error) {
    throw new TrainingSiteArchiveError(`failed to evaluate ${registry.path}: ${String(error)}`);
  }
  const value = context.window[registry.global];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TrainingSiteArchiveError(`${registry.path} does not assign window.${registry.global}`);
  }
  return value as Record<string, unknown>;
};

const guideUrlOf = (registry: Record<string, unknown>, dayKey: string): string | null => {
  const deck = registry[dayKey] as Record<string, unknown>;
  return typeof deck.guideUrl === 'string' ? deck.guideUrl : null;
};

/**
 * Import the Squad 1/2 day decks of a RyanLisse/aetherlink-training-site checkout as an archived course version.
 * Slides go through the day-decks importer unchanged; the old site's templates are derived at render time, so the
 * registries' `layout` values already are schema layouts and no archive-only layout is needed.
 */
export const importTrainingSiteArchive = (checkoutDir: string, origin: ArchiveOrigin): TrainingSiteArchive => {
  const decks = TRAINING_SITE_REGISTRIES.flatMap((registry) => {
    const raw = loadRegistry(checkoutDir, registry);
    const prefix = `archive-s${registry.squad}`;
    return decodeDayDecks(raw, registry.path, {lessonIdPrefix: prefix, idPrefix: prefix}).map((deck): ArchivedDeck => ({
      squad: registry.squad,
      day: Number(deck.dayKey.replace(/\D/g, '')),
      lessonId: `${prefix}-${deck.dayKey}`,
      title: deck.title,
      guideUrl: guideUrlOf(raw, deck.dayKey),
      slides: deck.slides.map((slide, index) => ({
        slide,
        source: {...origin, path: registry.path, pointer: `${registry.global}.${deck.dayKey}.slides[${index}]`},
      })),
    }));
  });
  const slides = decks.flatMap((deck) => deck.slides.map((entry) => entry.slide));
  return {
    status: 'archived',
    courseVersion: `training-site@${origin.commit.slice(0, 7)}`,
    origin,
    slideCount: slides.length,
    contentHash: contentHashSlides(slides),
    decks,
  };
};
