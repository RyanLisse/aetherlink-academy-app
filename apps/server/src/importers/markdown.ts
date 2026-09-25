import {decodeSlide, type Slide} from '@academy/schema';

export interface MarkdownLesson {
  readonly lesson: string;
  readonly day: string;
  readonly course: string;
  readonly mode: 'guided' | 'solo' | 'squad';
  readonly durationMinutes: number;
  readonly title: {readonly en: string; readonly nl?: string};
  readonly slides: ReadonlyArray<Slide>;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

const parseScalar = (raw: string): string | number | boolean => {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseSimpleFrontmatter = (block: string): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let objectAccum: Record<string, string> | null = null;
  for (const line of block.split('\n')) {
    if (!line.trim()) continue;
    const nested = line.match(/^\s{2}([A-Za-z0-9_]+):\s*(.*)$/);
    if (nested && currentKey) {
      objectAccum ??= {};
      objectAccum[nested[1]!] = String(parseScalar(nested[2]!));
      out[currentKey] = objectAccum;
      continue;
    }
    const top = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!top) continue;
    currentKey = top[1]!;
    objectAccum = null;
    const value = top[2]!;
    if (value === '' || value === '|' || value === '>') {
      out[currentKey] = {};
      objectAccum = out[currentKey] as Record<string, string>;
      continue;
    }
    out[currentKey] = parseScalar(value);
  }
  return out;
};

const slideField = (body: string, key: string): string | undefined => {
  const match = body.match(new RegExp(`(?:^|\\n)${key}:\\s*(.+?)(?=\\n[A-Za-z>]|\\n---|$)`, 's'));
  return match?.[1]?.trim();
};

const parseItems = (raw: string | undefined): ReadonlyArray<{label: string; caption?: string}> | undefined => {
  if (!raw) return undefined;
  const lines = raw.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- '));
  if (lines.length === 0) return undefined;
  return lines.map((line) => {
    const text = line.slice(2).trim();
    const [label, caption] = text.split(' | ');
    return caption ? {label: label!, caption} : {label: text};
  });
};

const parseList = (raw: string | undefined): ReadonlyArray<string> | undefined => {
  if (!raw) return undefined;
  const lines = raw.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- '));
  return lines.length > 0 ? lines.map((line) => line.slice(2).trim()) : undefined;
};

/** Import a Markdown lesson (frontmatter + `## Slide` blocks) into decoded slides. */
export const importMarkdown = (text: string, lessonId = 'markdown-lesson'): MarkdownLesson => {
  const fmMatch = text.match(FRONTMATTER_RE);
  if (!fmMatch) throw new Error('markdown lesson missing YAML frontmatter');
  const fm = parseSimpleFrontmatter(fmMatch[1]!);
  const body = text.slice(fmMatch[0].length);
  const blocks = body.split(/\n(?=## Slide\b)/).map((block) => block.trim()).filter(Boolean);
  const slides = blocks.map((block, index) => {
    const titleMatch = block.match(/^## Slide(?:\s+\d+)?\s*[—:-]\s*(.+)$/m) ?? block.match(/^## Slide\s*$/m);
    const title = titleMatch?.[1]?.trim() || `Slide ${index + 1}`;
    const notesMatch = block.match(/> notes:\s*([\s\S]*?)(?=\n## |\n$|$)/);
    const notes = notesMatch?.[1]?.trim();
    const type = slideField(block, 'type') ?? 'context';
    const layout = slideField(block, 'layout');
    const timerRaw = slideField(block, 'timer');
    const payload: Record<string, unknown> = {
      id: `md-${index + 1}`,
      lessonId,
      ordinal: index + 1,
      title,
      type,
      kicker: slideField(block, 'kicker'),
      subtitle: slideField(block, 'subtitle'),
      layout: layout || undefined,
      expected: slideField(block, 'expected'),
      check: slideField(block, 'check'),
      prompt: slideField(block, 'prompt'),
      tagline: slideField(block, 'tagline'),
      planB: slideField(block, 'planB'),
      image: slideField(block, 'image'),
      timer: timerRaw !== undefined ? Number(timerRaw) : undefined,
      items: parseItems(slideField(block, 'items')),
      steps: parseList(slideField(block, 'steps')),
      notes: notes || undefined,
    };
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) delete payload[key];
    }
    return decodeSlide(payload);
  });

  const title = fm.title;
  const titleEn = typeof title === 'object' && title && 'en' in (title as object)
    ? String((title as {en: string}).en)
    : String(fm.title ?? fm.lesson ?? 'Untitled');
  const titleNl = typeof title === 'object' && title && 'nl' in (title as object)
    ? String((title as {nl?: string}).nl)
    : undefined;

  return {
    lesson: String(fm.lesson ?? 'lesson'),
    day: String(fm.day ?? 'day'),
    course: String(fm.course ?? 'course'),
    mode: (String(fm.mode ?? 'guided') as 'guided' | 'solo' | 'squad'),
    durationMinutes: Number(fm.durationMinutes ?? 45),
    title: titleNl ? {en: titleEn, nl: titleNl} : {en: titleEn},
    slides,
  };
};

const dumpItems = (items: Slide['items']): string | undefined => {
  if (!items || items.length === 0) return undefined;
  return items.map((item) => `- ${item.caption ? `${item.label} | ${item.caption}` : item.label}`).join('\n');
};

const dumpSteps = (steps: Slide['steps']): string | undefined => {
  if (!steps || steps.length === 0) return undefined;
  return steps.map((step) => `- ${step}`).join('\n');
};

/** Export a Markdown lesson. Round-trips with `importMarkdown` for supported fields. */
export const exportLessonMarkdown = (lesson: MarkdownLesson): string => {
  const nlLine = lesson.title.nl ? `\n  nl: ${JSON.stringify(lesson.title.nl)}` : '';
  const header = `---
lesson: ${lesson.lesson}
day: ${lesson.day}
course: ${lesson.course}
mode: ${lesson.mode}
durationMinutes: ${lesson.durationMinutes}
title:
  en: ${JSON.stringify(lesson.title.en)}${nlLine}
---
`;
  const body = lesson.slides.map((slide, index) => {
    const lines = [`## Slide ${index + 1} — ${slide.title}`, `type: ${slide.type}`];
    if (slide.kicker) lines.push(`kicker: ${slide.kicker}`);
    if (slide.subtitle) lines.push(`subtitle: ${slide.subtitle}`);
    if (slide.layout) lines.push(`layout: ${slide.layout}`);
    if (slide.timer !== undefined) lines.push(`timer: ${slide.timer}`);
    if (slide.expected) lines.push(`expected: ${slide.expected}`);
    if (slide.check) lines.push(`check: ${slide.check}`);
    if (slide.prompt) lines.push(`prompt: ${slide.prompt}`);
    if (slide.tagline) lines.push(`tagline: ${slide.tagline}`);
    if (slide.planB) lines.push(`planB: ${slide.planB}`);
    if (slide.image) lines.push(`image: ${slide.image}`);
    const items = dumpItems(slide.items);
    if (items) lines.push(`items:\n${items}`);
    const steps = dumpSteps(slide.steps);
    if (steps) lines.push(`steps:\n${steps}`);
    if (slide.notes) lines.push(`> notes: ${slide.notes}`);
    return lines.join('\n');
  }).join('\n\n');
  return `${header}\n${body}\n`;
};

/** Round-trip helper used by tests and CLI. */
export const importExportEquals = (lesson: MarkdownLesson): boolean => {
  const again = importMarkdown(exportLessonMarkdown(lesson), lesson.slides[0]?.lessonId ?? 'markdown-lesson');
  return JSON.stringify(again.slides.map(({id: _i, lessonId: _l, ...rest}) => rest))
    === JSON.stringify(lesson.slides.map(({id: _i, lessonId: _l, ...rest}) => rest));
};
