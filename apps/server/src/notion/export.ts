import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import type {DayChecklistItem, DayScheduleEntry, ImportSource, LocalizedText} from '@academy/schema';
import {parseCsv} from './csv.ts';
import {sanitizeUntrusted} from './sanitize.ts';

export type ImportLocale = 'en' | 'nl';

export interface ImportedQuizQuestion {
  readonly day: number;
  readonly lessonSlug?: string;
  readonly question: LocalizedText;
  readonly options: readonly LocalizedText[];
  readonly answer: number;
  readonly source: ImportSource;
}

export interface ImportedGuardrailPage {
  readonly title: string;
  readonly source: ImportSource;
  readonly items: readonly string[];
}

/** Everything an authorized Notion export contributes, already sanitized and carrying provenance. */
export interface NotionExport {
  readonly retrievedAt: string;
  readonly synthetic: boolean;
  readonly schedules: ReadonlyArray<{readonly day: number; readonly source: ImportSource; readonly entries: readonly DayScheduleEntry[]}>;
  readonly checklists: ReadonlyArray<{readonly day: number; readonly source: ImportSource; readonly items: readonly DayChecklistItem[]}>;
  readonly quiz: readonly ImportedQuizQuestion[];
  readonly guardrails: readonly ImportedGuardrailPage[];
  readonly ignored: readonly string[];
  readonly rejected: ReadonlyArray<{readonly source: ImportSource; readonly reason: string}>;
  readonly dropped: ReadonlyArray<{readonly pageUrl: string; readonly rule: string; readonly line: string}>;
}

export class NotionExportError extends Error {}

export const MANIFEST_FILE = 'notion-export.json';

type PageKind = 'schedule' | 'checklist' | 'guardrails' | 'quiz';

/** Title conventions that route a Notion page to its Academy target. Unmatched pages are reported as ignored. */
const pageKinds: ReadonlyArray<{readonly kind: PageKind; readonly ext: '.md' | '.csv'; readonly title: RegExp}> = [
  {kind: 'schedule', ext: '.md', title: /^draaiboek\s+dag\s+(\d+)$/i},
  {kind: 'checklist', ext: '.md', title: /^checklist\s+dag\s+(\d+)$/i},
  {kind: 'guardrails', ext: '.md', title: /^(guardrails|ontwerpbeslissingen)\b/i},
  {kind: 'quiz', ext: '.csv', title: /^kahoot\b/i},
];

const notionId = /\s([0-9a-f]{32})(_all)?$/i;

interface ExportFile {
  readonly relativePath: string;
  readonly title: string;
  readonly ext: string;
  readonly pageUrl: string;
  readonly isAllView: boolean;
}

const describeFile = (root: string, absolute: string): ExportFile => {
  const relativePath = path.relative(root, absolute).split(path.sep).join('/');
  const ext = path.extname(absolute).toLowerCase();
  const stem = path.basename(absolute, path.extname(absolute));
  const match = notionId.exec(stem);
  return {
    relativePath,
    ext,
    title: (match ? stem.slice(0, match.index) : stem).trim(),
    pageUrl: match ? `https://www.notion.so/${match[1]!.toLowerCase()}` : `notion-export:${relativePath}`,
    isAllView: Boolean(match?.[2]),
  };
};

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, {withFileTypes: true});
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.isFile() ? [absolute] : [];
  }));
  return nested.flat().sort();
};

const readManifest = async (root: string): Promise<{retrievedAt: string; synthetic: boolean}> => {
  let raw: string;
  try {
    raw = await readFile(path.join(root, MANIFEST_FILE), 'utf8');
  } catch {
    throw new NotionExportError(`missing ${MANIFEST_FILE} in ${root}: write {"retrievedAt": "<ISO-8601 time the export was downloaded>"} next to the exported pages`);
  }
  const manifest = JSON.parse(raw) as {retrievedAt?: unknown; synthetic?: unknown};
  if (typeof manifest.retrievedAt !== 'string' || Number.isNaN(Date.parse(manifest.retrievedAt))) {
    throw new NotionExportError(`${MANIFEST_FILE}: retrievedAt must be an ISO-8601 timestamp`);
  }
  return {retrievedAt: new Date(manifest.retrievedAt).toISOString(), synthetic: manifest.synthetic === true};
};

const localize = (text: string, locale: ImportLocale): LocalizedText => (locale === 'nl' ? {en: text, nl: text} : {en: text});

const cells = (line: string): string[] => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const findColumn = (header: readonly string[], names: readonly string[]) => header.findIndex((cell) => names.includes(cell.toLowerCase()));

const parseScheduleTable = (body: string, source: ImportSource, locale: ImportLocale): DayScheduleEntry[] => {
  const lines = body.split('\n').filter((line) => line.trim().startsWith('|'));
  const [headerLine, separator, ...rows] = lines;
  if (!headerLine || !separator || !/^[\s|:-]+$/.test(separator)) return [];
  const header = cells(headerLine);
  const start = findColumn(header, ['start', 'begin', 'van']);
  const end = findColumn(header, ['eind', 'einde', 'end', 'tot']);
  const label = findColumn(header, ['onderdeel', 'activiteit', 'programma', 'label']);
  if (label < 0) return [];
  return rows.flatMap((row, index) => {
    const values = cells(row);
    const text = values[label] ?? '';
    if (text === '') return [];
    const startAt = start >= 0 ? values[start] : undefined;
    const endAt = end >= 0 ? values[end] : undefined;
    return [{
      label: localize(text, locale),
      ...(startAt ? {start: startAt} : {}),
      ...(endAt ? {end: endAt} : {}),
      source: {...source, locator: `row ${index + 1}`},
    }];
  });
};

const bulletItems = (body: string, pattern: RegExp): string[] =>
  body.split('\n').flatMap((line) => {
    const match = pattern.exec(line);
    const text = match?.[1]?.trim();
    return text ? [text] : [];
  });

const checkbox = /^\s*[-*]\s+\[[ xX]\]\s+(.+)$/;
const plainBullet = /^(?:[-*]|\d+\.)\s+(?!\[[ xX]\])(.+)$/;

const quizColumns = (header: readonly string[]) => {
  const lower = header.map((cell) => cell.toLowerCase());
  const options = lower
    .map((cell, index) => ({index, n: /^(?:answer|antwoord)\s*(\d+)/.exec(cell)?.[1]}))
    .filter((entry): entry is {index: number; n: string} => entry.n !== undefined)
    .sort((a, b) => Number(a.n) - Number(b.n))
    .map((entry) => entry.index);
  return {
    question: lower.findIndex((cell) => cell.startsWith('question') || cell.startsWith('vraag')),
    correct: lower.findIndex((cell) => cell.startsWith('correct') || cell.startsWith('juist')),
    day: lower.findIndex((cell) => cell === 'dag' || cell === 'day'),
    lesson: lower.findIndex((cell) => cell === 'les' || cell === 'lesson'),
    options,
  };
};

type QuizRowResult = {readonly ok: ImportedQuizQuestion} | {readonly reason: string};

const parseQuizRow = (row: readonly string[], columns: ReturnType<typeof quizColumns>, source: ImportSource, locale: ImportLocale): QuizRowResult => {
  const question = row[columns.question]?.trim() ?? '';
  if (question === '') return {reason: 'empty question'};
  const raw = columns.options.map((index) => row[index]?.trim() ?? '');
  const lastFilled = raw.findLastIndex((option) => option !== '');
  const options = raw.slice(0, lastFilled + 1);
  if (options.length < 2) return {reason: 'fewer than two answer options'};
  if (options.includes('')) return {reason: 'gap between answer options'};
  const correct = (row[columns.correct] ?? '').split(/[,;]/).map((value) => value.trim()).filter(Boolean);
  if (correct.length !== 1) return {reason: `expected exactly one correct answer, got ${correct.length}`};
  const answer = Number(correct[0]) - 1;
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return {reason: `correct answer '${correct[0]}' does not index an option`};
  const day = Number(row[columns.day]?.trim());
  if (!Number.isInteger(day)) return {reason: 'missing or non-numeric Dag column'};
  const lessonSlug = columns.lesson >= 0 ? row[columns.lesson]?.trim() : undefined;
  return {
    ok: {
      day,
      ...(lessonSlug ? {lessonSlug} : {}),
      question: localize(question, locale),
      options: options.map((option) => localize(option, locale)),
      answer,
      source,
    },
  };
};

/** Read an authorized Notion Markdown/CSV export directory. Never contacts Notion. */
export const readNotionExport = async (root: string, locale: ImportLocale = 'nl'): Promise<NotionExport> => {
  const {retrievedAt, synthetic} = await readManifest(root);
  const files = (await walk(root)).map((absolute) => ({absolute, file: describeFile(root, absolute)}));
  const allViews = new Set(files.filter(({file}) => file.isAllView).map(({file}) => file.pageUrl));

  const schedules: Array<NotionExport['schedules'][number]> = [];
  const checklists: Array<NotionExport['checklists'][number]> = [];
  const quiz: ImportedQuizQuestion[] = [];
  const guardrails: ImportedGuardrailPage[] = [];
  const ignored: string[] = [];
  const rejected: Array<NotionExport['rejected'][number]> = [];
  const dropped: Array<NotionExport['dropped'][number]> = [];

  const clean = (text: string, pageUrl: string): string => {
    const result = sanitizeUntrusted(text);
    for (const hit of result.dropped) dropped.push({pageUrl, ...hit});
    return result.text;
  };

  for (const {absolute, file} of files) {
    if (file.relativePath === MANIFEST_FILE || file.relativePath.toLowerCase() === 'readme.md') continue;
    const route = pageKinds.find((kind) => kind.ext === file.ext && kind.title.test(file.title));
    if (!route || (file.ext === '.csv' && !file.isAllView && allViews.has(file.pageUrl))) {
      ignored.push(file.relativePath);
      continue;
    }
    const source: ImportSource = {system: 'notion', pageUrl: file.pageUrl, retrievedAt};
    const raw = await readFile(absolute, 'utf8');
    const day = Number(route.title.exec(file.title)?.[1]);

    switch (route.kind) {
      case 'schedule':
        schedules.push({day, source, entries: parseScheduleTable(clean(raw, file.pageUrl), source, locale)});
        break;
      case 'checklist':
        checklists.push({
          day,
          source,
          items: bulletItems(clean(raw, file.pageUrl), checkbox).map((text, index) => ({...localize(text, locale), source: {...source, locator: `item ${index + 1}`}})),
        });
        break;
      case 'guardrails':
        guardrails.push({title: file.title, source, items: bulletItems(clean(raw, file.pageUrl), plainBullet)});
        break;
      case 'quiz': {
        const [header, ...rows] = parseCsv(raw);
        if (!header) break;
        const columns = quizColumns(header);
        rows.forEach((row, index) => {
          const rowSource: ImportSource = {...source, locator: `row ${index + 1}`};
          const result = parseQuizRow(row.map((cell) => clean(cell, file.pageUrl)), columns, rowSource, locale);
          if ('ok' in result) quiz.push(result.ok);
          else rejected.push({source: rowSource, reason: result.reason});
        });
        break;
      }
    }
  }

  return {retrievedAt, synthetic, schedules, checklists, quiz, guardrails, ignored, rejected, dropped};
};
