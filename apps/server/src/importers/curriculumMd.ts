import {readFileSync} from 'node:fs';
import type {Slide} from '@academy/schema';
import {contentHashSlides} from './contentHash.ts';
import {slideFromRaw} from './slideFromRaw.ts';

export class CurriculumMdImportError extends Error {
  readonly _tag = 'CurriculumMdImportError';
  constructor(message: string) {
    super(message);
    this.name = 'CurriculumMdImportError';
  }
}

export interface CurriculumMdImportResult {
  readonly slides: ReadonlyArray<Slide>;
  readonly titles: ReadonlyArray<string>;
  readonly contentHash: string;
  readonly sourcePath: string;
}

const FIELD_RE = /^\*\*([^*]+):\*\*\s*(.*)$/;

const parseSlideBlock = (heading: string, body: string): Record<string, unknown> => {
  const titleFromHeading = heading.replace(/^###\s*Slide\s+\d+\s*[—:-]\s*/i, '').trim();
  const fields: Record<string, string> = {};
  const lines = body.split('\n');
  let currentField: string | null = null;
  const accum: string[] = [];
  const flush = () => {
    if (!currentField) return;
    fields[currentField] = accum.join('\n').trim();
    accum.length = 0;
  };
  for (const line of lines) {
    const match = line.match(FIELD_RE);
    if (match) {
      flush();
      currentField = match[1]!.trim().toLowerCase();
      accum.push(match[2] ?? '');
      continue;
    }
    if (currentField) accum.push(line);
  }
  flush();

  const onSlide = fields['on slide'] ?? '';
  const items = onSlide
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => ({label: line.slice(2).trim()}));

  const title = String(fields.title ?? (titleFromHeading || 'Untitled')).trim();
  const timerMatch = (fields.time ?? '').match(/(\d+)/);
  const notes = fields['facilitator note'] ?? fields.notes;

  return {
    title,
    kicker: fields.kicker,
    subtitle: fields.subtitle,
    notes,
    timer: timerMatch ? Number(timerMatch[1]) : undefined,
    items: items.length > 0 ? items : undefined,
    steps: items.length > 0 && /assignment/i.test(title) ? items.map((item) => item.label) : undefined,
  };
};

/** Import classroom CURRICULUM.md (`### Slide n`, `**Title:**`, `**On slide:**`). */
export const importCurriculumMd = (sourcePath: string, options: {readonly lessonId?: string; readonly idPrefix?: string} = {}): CurriculumMdImportResult => {
  const lessonId = options.lessonId ?? 'curriculum-lesson';
  const idPrefix = options.idPrefix ?? 'curriculum';
  const text = readFileSync(sourcePath, 'utf8');
  const parts = text.split(/\n(?=###\s+Slide\b)/i).map((part) => part.trim()).filter((part) => /^###\s+Slide\b/i.test(part));
  if (parts.length === 0) throw new CurriculumMdImportError(`no ### Slide blocks in ${sourcePath}`);

  const slides = parts.map((part, index) => {
    const firstLineEnd = part.indexOf('\n');
    const heading = firstLineEnd >= 0 ? part.slice(0, firstLineEnd) : part;
    const body = firstLineEnd >= 0 ? part.slice(firstLineEnd + 1) : '';
    const raw = parseSlideBlock(heading, body);
    return slideFromRaw(raw, {id: `${idPrefix}-${index + 1}`, lessonId, ordinal: index + 1});
  });

  return {
    slides,
    titles: slides.map((slide) => slide.title),
    contentHash: contentHashSlides(slides),
    sourcePath,
  };
};
