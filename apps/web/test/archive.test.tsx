// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe, expect, test} from 'vitest';
import raw from '../../../content/archive/training-site.json' with {type: 'json'};
import {matchArchive, parseArchive} from '../src/archive/archive.ts';
import {ArchiveView} from '../src/archive/ArchiveView.tsx';
import {I18nProvider} from '../src/i18n.tsx';
import {REFERENCE_DAYS} from '../src/reference/index.ts';
import {CLASSROOM_1_SLIDE_COUNT, LEGACY_RULES, legacyStubHtml, resolveLegacyUrl} from '../src/redirects/legacy.ts';

const catalog = parseArchive(raw);

const mount = async (element: React.ReactElement) => {
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
  const scrolled: string[] = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this.id);
  };
  window.scrollTo = () => {};
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(<I18nProvider initialLocale="nl" storage={{getItem: () => null, setItem: () => {}}}>{element}</I18nProvider>);
  });
  return {host, scrolled, unmount: () => act(() => root.unmount())};
};

describe('training-site archive', () => {
  test('parses ten archived decks with 224 slides from the generated archive', () => {
    expect(catalog.courseVersion).toBe('training-site@df61155');
    expect(catalog.decks.map((deck) => [deck.squad, deck.day, deck.lessonId, deck.slides.length])).toEqual([
      [1, 1, 'archive-s1-day1', 23], [1, 2, 'archive-s1-day2', 19], [1, 3, 'archive-s1-day3', 24], [1, 4, 'archive-s1-day4', 25], [1, 5, 'archive-s1-day5', 33],
      [2, 1, 'archive-s2-day1', 23], [2, 2, 'archive-s2-day2', 18], [2, 3, 'archive-s2-day3', 15], [2, 4, 'archive-s2-day4', 23], [2, 5, 'archive-s2-day5', 21],
    ]);
  });

  test('every archived slide names the repo, commit, file and registry pointer it came from', () => {
    const sources = raw.decks.flatMap((deck) => deck.slides.map((entry) => entry.source));
    expect(sources).toHaveLength(224);
    expect(new Set(sources.map((source) => `${source.repo}@${source.commit}`))).toEqual(new Set(['RyanLisse/aetherlink-training-site@df611554d4e1cc0ab56c8ebc1221edcc7d9ba10b']));
    expect(sources[23]).toEqual({repo: 'RyanLisse/aetherlink-training-site', commit: 'df611554d4e1cc0ab56c8ebc1221edcc7d9ba10b', path: 'dist/days.js', pointer: 'DAYS.day2.slides[0]'});
    expect(sources[223]).toEqual({repo: 'RyanLisse/aetherlink-training-site', commit: 'df611554d4e1cc0ab56c8ebc1221edcc7d9ba10b', path: 'dist/squad2.js', pointer: 'SQUAD2.day5.slides[20]'});
  });

  test('routes cover the index and squad/day pages only', () => {
    expect(matchArchive('/archive')).toEqual({kind: 'index'});
    expect(matchArchive('/archive/squad-2/day-4')).toEqual({kind: 'deck', squad: 2, day: 4});
    expect(matchArchive('/archive/squad-2')).toBeNull();
    expect(matchArchive('/reference')).toBeNull();
  });

  test('a squad day renders every slide through the deck reader, anchored, with the archive notice and without speaker notes', async () => {
    const {host, scrolled, unmount} = await mount(<ArchiveView page={{kind: 'deck', squad: 1, day: 3}} navigate={() => {}} anchor="slide-archive-s1-day3-5" catalog={catalog} />);
    const articles = [...host.querySelectorAll('.academy-deck.mode-reader .reader-lesson > article')];
    expect(articles).toHaveLength(24);
    expect(articles[4]!.id).toBe('slide-archive-s1-day3-5');
    expect(articles[4]!.hasAttribute('data-anchored')).toBe(true);
    expect(articles[0]!.querySelector('h2')!.textContent).toBe(catalog.decks[2]!.slides[0]!.title);
    expect(scrolled).toEqual(['slide-archive-s1-day3-5']);
    expect(host.querySelector('.archive-title')!.textContent).toBe('Day 3 — AI-native SDLC: from intent to evidence');
    expect(host.querySelector('.archive-notice')!.textContent).toContain('Gearchiveerde cursusversie');
    expect(host.querySelector('.archive-notice a')!.getAttribute('href')).toBe('https://github.com/RyanLisse/aetherlink-training-site/tree/df611554d4e1cc0ab56c8ebc1221edcc7d9ba10b');
    const notes = catalog.decks[2]!.slides.map((slide) => slide.notes).filter((note): note is string => typeof note === 'string' && note.length > 40);
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) expect(host.textContent).not.toContain(note);
    await unmount();
  });

  test('the index lists both squads with slide counts', async () => {
    const {host, unmount} = await mount(<ArchiveView page={{kind: 'index'}} navigate={() => {}} catalog={catalog} />);
    expect([...host.querySelectorAll('.archive-squad h2')].map((node) => node.textContent)).toEqual(['Squad 1', 'Squad 2']);
    expect([...host.querySelectorAll('.reference-days a')].map((node) => node.getAttribute('href'))).toEqual([
      '/archive/squad-1/day-1', '/archive/squad-1/day-2', '/archive/squad-1/day-3', '/archive/squad-1/day-4', '/archive/squad-1/day-5',
      '/archive/squad-2/day-1', '/archive/squad-2/day-2', '/archive/squad-2/day-3', '/archive/squad-2/day-4', '/archive/squad-2/day-5',
    ]);
    expect(host.querySelector('.reference-days a')!.textContent).toContain('23 slides');
    await unmount();
  });
});

describe('legacy redirect map', () => {
  test('every archive redirect lands on a deck that exists, with a slide anchor the reader assigns', () => {
    const archiveRules = LEGACY_RULES.filter((rule) => rule.to.kind === 'archive-deck');
    expect(archiveRules).toHaveLength(10);
    for (const rule of archiveRules) {
      const target = resolveLegacyUrl(rule.site, `${rule.from}#2`);
      const [path, anchor] = target.split('#');
      const page = matchArchive(path!);
      expect(page?.kind, target).toBe('deck');
      const deck = page?.kind === 'deck' ? catalog.decks.find((entry) => entry.squad === page.squad && entry.day === page.day) : undefined;
      expect(anchor).toBe(`slide-${deck!.lessonId}-2`);
    }
  });

  test('the classroom split point matches the Classroom 1 reference day', () => {
    expect(REFERENCE_DAYS[0]!.slides.length).toBe(CLASSROOM_1_SLIDE_COUNT);
    expect(resolveLegacyUrl('classroom-slides', `/#${CLASSROOM_1_SLIDE_COUNT + 1}`)).toBe('/classroom/2');
  });

  test('the stub for an old host forwards the full address to the Academy endpoint', () => {
    const html = legacyStubHtml('training-site', 'https://academy.aetherlink.ai');
    expect(html).toContain('location.replace("https://academy.aetherlink.ai/legacy-redirect?site=training-site&from=" + encodeURIComponent(location.href));');
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=https://academy.aetherlink.ai/archive">');
  });
});
