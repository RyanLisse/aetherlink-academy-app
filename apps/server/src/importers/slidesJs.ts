import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {decodeSlide, type Slide} from '@academy/schema';
import {contentHashSlides} from './contentHash.ts';

export class SlidesJsImportError extends Error {
  readonly _tag = 'SlidesJsImportError';
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SlidesJsImportError';
    this.cause = cause;
  }
}

export interface SlidesJsImportResult {
  readonly slides: ReadonlyArray<Slide>;
  readonly titles: ReadonlyArray<string>;
  readonly contentHash: string;
  readonly sourcePath: string;
}

const loadWindowSlides = (sourcePath: string): ReadonlyArray<Record<string, unknown>> => {
  const check = spawnSync(process.execPath, ['--check', sourcePath], {encoding: 'utf8'});
  if (check.status !== 0) {
    throw new SlidesJsImportError(`node --check failed for ${sourcePath}: ${check.stderr || check.stdout}`);
  }

  const source = readFileSync(sourcePath, 'utf8');
  const context: {window: {SLIDES?: unknown}} = {window: {}};
  vm.createContext(context);
  try {
    vm.runInContext(source, context, {filename: sourcePath, timeout: 5_000});
  } catch (error) {
    throw new SlidesJsImportError(`failed to evaluate ${sourcePath}`, error);
  }

  const slides = context.window.SLIDES;
  if (!Array.isArray(slides)) {
    throw new SlidesJsImportError(`no window.SLIDES array in ${sourcePath}`);
  }
  return slides as ReadonlyArray<Record<string, unknown>>;
};

export interface ImportSlidesJsOptions {
  readonly lessonId?: string;
  readonly idPrefix?: string;
}

/** Import a classroom `slides.js` into decoded `Slide` values. Mismatches throw Schema.ParseError (path names the field). */
export const importSlidesJs = (sourcePath: string, options: ImportSlidesJsOptions = {}): SlidesJsImportResult => {
  const lessonId = options.lessonId ?? 'imported-lesson';
  const idPrefix = options.idPrefix ?? 'slide';
  const raw = loadWindowSlides(sourcePath);
  const slides = raw.map((source, index) => {
    const withIdentity = {
      id: `${idPrefix}-${index + 1}`,
      lessonId,
      ordinal: index + 1,
      ...source,
    };
    return decodeSlide(withIdentity);
  });
  return {
    slides,
    titles: slides.map((slide) => slide.title),
    contentHash: contentHashSlides(slides),
    sourcePath,
  };
};
