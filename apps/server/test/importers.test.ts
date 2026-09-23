import {createHash} from 'node:crypto';
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {contentHashSlides, DraftLedger, exportLessonMarkdown, importMarkdown, importSlidesJs} from '../src/importers/index.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleFixture = path.join(here, 'fixtures/sample-slides.js');

const PINNED_COMMIT = '0c194f6fc38481290922b878ac5a7d31ca795c8d';
const PINNED_DIGEST = '7a6785dde8972216291fe99139e402a85d2e7a2a142f491b4ebe795db558a8ae';
const RAW_URL = `https://raw.githubusercontent.com/jyse/aetherlink-classroom-slides/${PINNED_COMMIT}/slides.js`;

const cachePath = (): string => {
  const dir = path.join(tmpdir(), 'academy-aet-24-slides');
  mkdirSync(dir, {recursive: true});
  return path.join(dir, `slides-${PINNED_COMMIT}.js`);
};

const ensurePinnedSlidesJs = async (): Promise<string> => {
  const dest = cachePath();
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
    // Lossless titles vs raw window.SLIDES
    const vm = await import('node:vm');
    const context: {window: {SLIDES?: Array<{title: string}>}} = {window: {}};
    vm.createContext(context);
    vm.runInContext(readFileSync(sourcePath, 'utf8'), context, {filename: sourcePath, timeout: 5_000});
    const rawTitles = context.window.SLIDES!.map((s) => s.title);
    expect(imported.titles).toEqual(rawTitles);
  }, 60_000);
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
    // Round-trip the fields the Markdown format owns (title/type/layout/items/steps/timer/expected/check/notes).
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
});
