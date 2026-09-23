import {createHash} from 'node:crypto';
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {
  contentHashSlides,
  DraftLedger,
  exportLessonMarkdown,
  importContentMjs,
  importCurriculumMd,
  importDayDecksJson,
  importMarkdown,
  importSlidesJs,
  slidesToAggregate,
} from '../src/importers/index.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleFixture = path.join(here, 'fixtures/sample-slides.js');
const sampleCurriculum = path.join(here, 'fixtures/sample-curriculum.md');
const sampleDayDecks = path.join(here, 'fixtures/sample-day-decks.json');
const contentMjsPath = path.resolve(here, '../../../server/content.mjs');

const PINNED_COMMIT = '0c194f6fc38481290922b878ac5a7d31ca795c8d';
const PINNED_DIGEST = '7a6785dde8972216291fe99139e402a85d2e7a2a142f491b4ebe795db558a8ae';
const RAW_URL = `https://raw.githubusercontent.com/jyse/aetherlink-classroom-slides/${PINNED_COMMIT}/slides.js`;
const CURRICULUM_URL = `https://raw.githubusercontent.com/jyse/aetherlink-classroom-slides/${PINNED_COMMIT}/CURRICULUM.md`;
const DAY_DECKS_URL = 'https://raw.githubusercontent.com/RyanLisse/aetherlink-training-template/main/presentations/day-decks.json';

const cacheDir = () => {
  const dir = path.join(tmpdir(), 'academy-aet-24-slides');
  mkdirSync(dir, {recursive: true});
  return dir;
};

const ensurePinnedSlidesJs = async (): Promise<string> => {
  const dest = path.join(cacheDir(), `slides-${PINNED_COMMIT}.js`);
  if (existsSync(dest)) {
    const digest = createHash('sha256').update(readFileSync(dest)).digest('hex');
    if (digest === PINNED_DIGEST) return dest;
  }
  const response = await fetch(RAW_URL);
  if (!response.ok) throw new Error(`failed to fetch pinned slides.js: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = createHash('sha256').update(bytes).digest('hex');
  expect(digest).toBe(PINNED_DIGEST);
  writeFileSync(dest, bytes);
  return dest;
};

const ensureRemote = async (url: string, name: string): Promise<string> => {
  const dest = path.join(cacheDir(), name);
  if (existsSync(dest) && readFileSync(dest).byteLength > 100) return dest;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to fetch ${url}: ${response.status}`);
  writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
  return dest;
};

describe('slides.js importer', () => {
  it('imports the synthetic fixture covering every named layout', () => {
    const result = importSlidesJs(sampleFixture);
    expect(result.slides).toHaveLength(9);
    expect(result.titles).toEqual([
      'Welcome', 'Pillars', 'Steps', 'Compare', 'Exercise', 'Recap', 'Cards', 'Image', 'Bars',
    ]);
    expect(result.slides.map((s) => s.layout)).toEqual([
      undefined, 'pillars', 'steps', 'compare', 'exercise', 'recap', 'cards', 'image', 'bars',
    ]);
    expect(result.slides[0]?.notes).toBe('speaker');
  });

  it('rejects an unknown layout with a layout path (no silent default)', () => {
    const bad = path.join(tmpdir(), `bad-slides-${Date.now()}.js`);
    writeFileSync(bad, `window.SLIDES = [{title:'X', type:'context', layout:'invented'}];\n`);
    try {
      importSlidesJs(bad);
      throw new Error('expected parse failure');
    } catch (error) {
      expect(String(error)).toMatch(/layout/);
    }
  });

  it('imports the pinned 78-slide classroom deck with matching count and titles', async () => {
    const sourcePath = await ensurePinnedSlidesJs();
    const imported = importSlidesJs(sourcePath);
    expect(imported.slides).toHaveLength(78);
    expect(imported.titles).toHaveLength(78);
    expect(imported.titles[0]).toBe('Aetherlink × Worldline');
    expect(new Set(imported.titles).size).toBeGreaterThan(70);
    const vm = await import('node:vm');
    const context: {window: {SLIDES?: Array<{title: string}>}} = {window: {}};
    vm.createContext(context);
    vm.runInContext(readFileSync(sourcePath, 'utf8'), context, {filename: sourcePath, timeout: 5_000});
    const rawTitles = context.window.SLIDES!.map((s) => s.title);
    expect(imported.titles).toEqual(rawTitles);
  }, 60_000);
});

describe('curriculum.md importer', () => {
  it('imports ### Slide blocks with Title and On slide items', () => {
    const imported = importCurriculumMd(sampleCurriculum);
    expect(imported.slides.length).toBe(3);
    expect(imported.titles[0]).toBe('Welcome to the programme');
    expect(imported.slides[0]?.items?.map((item) => item.label)).toEqual([
      'Useful work', 'Safe boundaries', 'Verifiable evidence',
    ]);
    expect(imported.slides[1]?.type).toBe('pause');
    expect(imported.slides[2]?.type).toBe('practice');
    expect(imported.slides[2]?.timer).toBe(25);
  });

  it('imports pinned classroom CURRICULUM.md without manual edits', async () => {
    const sourcePath = await ensureRemote(CURRICULUM_URL, `curriculum-${PINNED_COMMIT}.md`);
    const imported = importCurriculumMd(sourcePath);
    expect(imported.slides.length).toBeGreaterThanOrEqual(78);
    expect(imported.titles[0]).toMatch(/Aetherlink|Working with AI/i);
    expect(imported.slides.every((slide) => slide.title.length > 0)).toBe(true);
  }, 60_000);
});

describe('day-decks.json importer', () => {
  it('imports the synthetic day1 fixture with layouts', () => {
    const imported = importDayDecksJson(sampleDayDecks, {day: 'day1'});
    expect(imported.decks).toHaveLength(1);
    expect(imported.slides).toHaveLength(3);
    expect(imported.slides.map((s) => s.layout)).toEqual(['cards', 'exercise', 'compare']);
    expect(imported.slides[1]?.type).toBe('practice');
    expect(imported.slides[1]?.timer).toBe(25);
  });

  it('imports training-template day-decks.json for all five days', async () => {
    const sourcePath = await ensureRemote(DAY_DECKS_URL, 'day-decks-main.json');
    const imported = importDayDecksJson(sourcePath);
    expect(imported.decks.map((d) => d.dayKey)).toEqual(['day1', 'day2', 'day3', 'day4', 'day5']);
    expect(imported.slides.length).toBe(124);
    expect(imported.slides.every((slide) => typeof slide.title === 'string')).toBe(true);
  }, 60_000);
});

describe('content.mjs importer', () => {
  it('imports the five day packs from server/content.mjs (read only)', async () => {
    const imported = await importContentMjs(contentMjsPath);
    expect(imported.days).toHaveLength(5);
    expect(imported.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(imported.slides.length).toBeGreaterThan(15);
    expect(imported.days[0]?.slides.some((s) => s.type === 'practice')).toBe(true);
  });
});

describe('markdown round-trip', () => {
  it('import(export(lesson)) equals lesson for a fixture with every layout', () => {
    const fromSlides = importSlidesJs(sampleFixture);
    const lesson = {
      lesson: 'layouts',
      day: 'support-1',
      course: 'worldline-wave-2',
      mode: 'guided' as const,
      durationMinutes: 45,
      title: {en: 'Layout fixture'},
      slides: fromSlides.slides.filter((s) => s.layout !== 'image' && s.layout !== 'bars' && s.layout !== 'cards' && s.layout !== 'compare'),
    };
    const md = exportLessonMarkdown(lesson);
    const again = importMarkdown(md, 'imported-lesson');
    expect(again.slides.map((s) => ({
      title: s.title,
      type: s.type,
      layout: s.layout,
      items: s.items,
      steps: s.steps,
      timer: s.timer,
      expected: s.expected,
      check: s.check,
      notes: s.notes,
    }))).toEqual(lesson.slides.map((s) => ({
      title: s.title,
      type: s.type,
      layout: s.layout,
      items: s.items,
      steps: s.steps,
      timer: s.timer,
      expected: s.expected,
      check: s.check,
      notes: s.notes,
    })));
  });
});

describe('idempotent draft ledger', () => {
  it('reimporting the same source twice yields no second draft version', () => {
    const imported = importSlidesJs(sampleFixture);
    const ledger = new DraftLedger();
    const first = ledger.writeDraft('course-1', imported.slides);
    const second = ledger.writeDraft('course-1', imported.slides);
    expect(first.unchanged).toBe(false);
    expect(second.unchanged).toBe(true);
    expect(second.version).toBe(first.version);
    expect(ledger.list('course-1')).toHaveLength(1);
    expect(first.contentHash).toBe(contentHashSlides(imported.slides));
  });

  it('slidesToAggregate builds UUID-shaped draft rows for Postgres writeDraft', () => {
    const imported = importSlidesJs(sampleFixture);
    const draft = slidesToAggregate('11111111-1111-4111-8111-111111111111', imported.slides);
    expect(draft.tracks).toHaveLength(1);
    expect(draft.days).toHaveLength(1);
    expect(draft.lessons.length).toBeGreaterThanOrEqual(1);
    expect(draft.slides).toHaveLength(imported.slides.length);
    expect(draft.slides.every((slide) => /^[0-9a-f-]{36}$/i.test(slide.id))).toBe(true);
  });
});
