import {readFileSync} from 'node:fs';
import type {Slide} from '@academy/schema';
import {contentHashSlides} from './contentHash.ts';
import {slideFromRaw} from './slideFromRaw.ts';

export class DayDecksJsonImportError extends Error {
  readonly _tag = 'DayDecksJsonImportError';
  constructor(message: string) {
    super(message);
    this.name = 'DayDecksJsonImportError';
  }
}

export interface DayDeckImport {
  readonly dayKey: string;
  readonly title: string;
  readonly slides: ReadonlyArray<Slide>;
  readonly titles: ReadonlyArray<string>;
  readonly contentHash: string;
}

export interface DayDecksJsonImportResult {
  readonly decks: ReadonlyArray<DayDeckImport>;
  readonly slides: ReadonlyArray<Slide>;
  readonly titles: ReadonlyArray<string>;
  readonly contentHash: string;
  readonly sourcePath: string;
}

/** Import training-template `presentations/day-decks.json` (day1..dayN → Slide[]). */
export const importDayDecksJson = (
  sourcePath: string,
  options: {readonly lessonIdPrefix?: string; readonly idPrefix?: string; readonly day?: string} = {},
): DayDecksJsonImportResult => {
  const lessonIdPrefix = options.lessonIdPrefix ?? 'day-deck';
  const idPrefix = options.idPrefix ?? 'day-deck';
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(sourcePath, 'utf8'));
  } catch (error) {
    throw new DayDecksJsonImportError(`invalid JSON in ${sourcePath}: ${String(error)}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DayDecksJsonImportError(`expected object root in ${sourcePath}`);
  }

  const root = parsed as Record<string, unknown>;
  const dayKeys = Object.keys(root).filter((key) => /^day\d+$/i.test(key)).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));
  const selected = options.day ? dayKeys.filter((key) => key.toLowerCase() === options.day!.toLowerCase()) : dayKeys;
  if (selected.length === 0) throw new DayDecksJsonImportError(`no day decks found in ${sourcePath}`);

  const decks: DayDeckImport[] = [];
  for (const dayKey of selected) {
    const day = root[dayKey];
    if (!day || typeof day !== 'object' || Array.isArray(day)) {
      throw new DayDecksJsonImportError(`day '${dayKey}' is not an object`);
    }
    const record = day as Record<string, unknown>;
    const rawSlides = record.slides;
    if (!Array.isArray(rawSlides)) throw new DayDecksJsonImportError(`day '${dayKey}' missing slides array`);
    const lessonId = `${lessonIdPrefix}-${dayKey}`;
    const slides = rawSlides.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new DayDecksJsonImportError(`day '${dayKey}' slide ${index + 1} is not an object`);
      }
      return slideFromRaw(entry as Record<string, unknown>, {
        id: `${idPrefix}-${dayKey}-${index + 1}`,
        lessonId,
        ordinal: index + 1,
      });
    });
    decks.push({
      dayKey,
      title: String(record.title ?? dayKey),
      slides,
      titles: slides.map((slide) => slide.title),
      contentHash: contentHashSlides(slides),
    });
  }

  const slides = decks.flatMap((deck) => deck.slides);
  return {
    decks,
    slides,
    titles: slides.map((slide) => slide.title),
    contentHash: contentHashSlides(slides),
    sourcePath,
  };
};
