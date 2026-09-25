import {pathToFileURL} from 'node:url';
import type {Slide} from '@academy/schema';
import {contentHashSlides} from './contentHash.ts';
import {slideFromRaw} from './slideFromRaw.ts';

export class ContentMjsImportError extends Error {
  readonly _tag = 'ContentMjsImportError';
  constructor(message: string) {
    super(message);
    this.name = 'ContentMjsImportError';
  }
}

export interface ContentMjsDayImport {
  readonly day: number;
  readonly title: string;
  readonly slides: ReadonlyArray<Slide>;
  readonly titles: ReadonlyArray<string>;
  readonly contentHash: string;
}

export interface ContentMjsImportResult {
  readonly days: ReadonlyArray<ContentMjsDayImport>;
  readonly slides: ReadonlyArray<Slide>;
  readonly titles: ReadonlyArray<string>;
  readonly contentHash: string;
  readonly sourcePath: string;
}

type DayPack = {
  readonly day: number;
  readonly title: string;
  readonly tag?: string;
  readonly blurb?: string;
  readonly lesson?: {
    readonly kicker?: string;
    readonly title?: string;
    readonly lede?: string;
    readonly loop?: ReadonlyArray<{readonly label: string; readonly prompt: string}>;
    readonly workedExample?: string;
  };
  readonly quiz?: {
    readonly questions?: ReadonlyArray<{readonly question: string; readonly options: ReadonlyArray<{readonly label: string}>}>;
  };
  readonly mission?: {
    readonly id?: string;
    readonly title?: string;
    readonly goal?: string;
    readonly minutes?: number;
    readonly checks?: ReadonlyArray<string>;
  };
  readonly reviewCriteria?: ReadonlyArray<string>;
  readonly steps?: ReadonlyArray<{readonly title?: string; readonly goal?: string; readonly doneWhen?: string}>;
};

const packToRawSlides = (pack: DayPack): Record<string, unknown>[] => {
  const raw: Record<string, unknown>[] = [];
  raw.push({
    title: pack.title,
    kicker: pack.tag ? `DAY ${pack.day} · ${pack.tag}` : `DAY ${pack.day}`,
    subtitle: pack.blurb,
    type: 'context',
    cards: pack.blurb ? [{title: 'Focus', body: pack.blurb}] : undefined,
  });

  if (pack.lesson) {
    const loopItems = (pack.lesson.loop ?? []).map((step) => ({label: step.label, caption: step.prompt}));
    raw.push({
      title: pack.lesson.title ?? `Lesson day ${pack.day}`,
      kicker: pack.lesson.kicker,
      subtitle: pack.lesson.lede,
      type: 'concept',
      layout: loopItems.length > 0 ? 'steps' : undefined,
      items: loopItems.length > 0 ? loopItems : undefined,
      notes: pack.lesson.workedExample,
    });
  }

  for (const step of pack.steps ?? []) {
    raw.push({
      title: step.title ?? 'Progressive step',
      subtitle: step.goal,
      type: 'concept',
      layout: 'steps',
      steps: [step.goal, step.doneWhen].filter(Boolean) as string[],
      expected: step.doneWhen,
    });
  }

  for (const question of pack.quiz?.questions ?? []) {
    raw.push({
      title: question.question,
      type: 'review',
      layout: 'cards',
      cards: question.options.map((option, index) => ({title: String.fromCharCode(65 + index), body: option.label})),
    });
  }

  if (pack.mission) {
    raw.push({
      title: pack.mission.title ?? `Mission day ${pack.day}`,
      subtitle: pack.mission.goal,
      type: 'practice',
      layout: 'exercise',
      timer: pack.mission.minutes,
      steps: pack.mission.checks,
      expected: pack.mission.goal,
      check: (pack.reviewCriteria ?? []).join(' · ') || undefined,
    });
  }

  return raw;
};

/**
 * Import the five day packs from legacy `server/content.mjs` (read only — never edit that file).
 * Uses dynamic `import()` of the source path.
 */
export const importContentMjs = async (
  sourcePath: string,
  options: {readonly lessonIdPrefix?: string; readonly idPrefix?: string; readonly day?: number} = {},
): Promise<ContentMjsImportResult> => {
  const lessonIdPrefix = options.lessonIdPrefix ?? 'content-mjs';
  const idPrefix = options.idPrefix ?? 'content-mjs';
  let mod: {getDayPack?: (day: number) => DayPack | null; listDaySummaries?: () => ReadonlyArray<{day: number}>};
  try {
    mod = await import(pathToFileURL(sourcePath).href);
  } catch (error) {
    throw new ContentMjsImportError(`failed to import ${sourcePath}: ${String(error)}`);
  }
  if (typeof mod.getDayPack !== 'function') {
    throw new ContentMjsImportError(`no getDayPack export in ${sourcePath}`);
  }

  const dayNumbers = options.day !== undefined
    ? [options.day]
    : (mod.listDaySummaries?.().map((entry) => entry.day) ?? [1, 2, 3, 4, 5]);

  const days: ContentMjsDayImport[] = [];
  for (const day of dayNumbers) {
    const pack = mod.getDayPack!(day);
    if (!pack) throw new ContentMjsImportError(`no day pack for day ${day} in ${sourcePath}`);
    const lessonId = `${lessonIdPrefix}-day-${day}`;
    const slides = packToRawSlides(pack).map((raw, index) =>
      slideFromRaw(raw, {id: `${idPrefix}-d${day}-${index + 1}`, lessonId, ordinal: index + 1}),
    );
    days.push({
      day,
      title: pack.title,
      slides,
      titles: slides.map((slide) => slide.title),
      contentHash: contentHashSlides(slides),
    });
  }

  const slides = days.flatMap((day) => day.slides);
  return {
    days,
    slides,
    titles: slides.map((slide) => slide.title),
    contentHash: contentHashSlides(slides),
    sourcePath,
  };
};
