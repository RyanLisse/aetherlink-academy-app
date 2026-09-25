// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {describe, expect, test} from 'vitest';
import {I18nProvider} from '../src/i18n.tsx';
import {matchReference, REFERENCE_DAYS, ReferenceView, searchBundledDays, snippetRuns, type ReferencePage} from '../src/reference/index.ts';

const render = (page: ReferencePage, locale: 'en' | 'nl' = 'en') =>
  renderToString(
    <I18nProvider initialLocale={locale} storage={{getItem: () => null, setItem: () => {}}}>
      <ReferenceView page={page} navigate={() => {}} />
    </I18nProvider>,
  );

describe('reference view per day', () => {
  test('routes cover the index, seven days and the glossary', () => {
    expect(matchReference('/reference')).toEqual({kind: 'index'});
    expect(matchReference('/reference/glossary')).toEqual({kind: 'glossary'});
    expect(matchReference('/reference/day/3')).toMatchObject({kind: 'day', day: {day: 3, lessonId: 'workshop-3'}});
    expect(matchReference('/reference/day/8')).toBeNull();
    expect(REFERENCE_DAYS.map((day) => [day.day, day.slides.length])).toEqual([[1, 44], [2, 47], [3, 18], [4, 16], [5, 33], [6, 14], [7, 14]]);
  });

  test('a day renders every slide as an anchored reading article through the deck reader mode, without speaker notes', async () => {
    (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
    const scrolled: string[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.id);
    };
    window.scrollTo = () => {};
    const day = REFERENCE_DAYS[2]!;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <I18nProvider initialLocale="en" storage={{getItem: () => null, setItem: () => {}}}>
          <ReferenceView page={{kind: 'day', day}} navigate={() => {}} anchor="slide-workshop-3-5" />
        </I18nProvider>,
      );
    });
    expect(host.querySelector('.academy-deck')?.classList.contains('mode-reader')).toBe(true);
    const articles = [...host.querySelectorAll('.reader-lesson > article')];
    expect(articles.map((article) => article.id)).toEqual(day.slides.map((slide) => `slide-workshop-3-${slide.ordinal}`));
    expect(host.querySelector('[data-anchored]')?.id).toBe('slide-workshop-3-5');
    expect(scrolled).toEqual(['slide-workshop-3-5']);
    expect(host.textContent).toContain('One ticket. Three agency levels.');
    expect(host.textContent).not.toContain('Rhythm all day');
    await act(async () => root.unmount());
    host.remove();
  });

  test('the glossary page states that no glossary source exists instead of inventing entries', () => {
    expect(render({kind: 'glossary'})).toContain('No glossary has been imported for this course yet.');
    expect(render({kind: 'glossary'}, 'nl')).toContain('Voor deze cursus is nog geen woordenlijst geïmporteerd.');
  });
});

describe('bundled reference search', () => {
  test('hits link to the day and the slide anchor', () => {
    const [first] = searchBundledDays(REFERENCE_DAYS, 'glossary contribution');
    expect(first).toMatchObject({type: 'slide', day: 1, lessonId: 'teaching-day-1', slideAnchor: 'slide-teaching-day-1-40', title: 'Assignment 3: Glossary contribution'});
  });

  test('terms that only occur in speaker notes are not searchable', () => {
    expect(searchBundledDays(REFERENCE_DAYS, 'temptation')).toEqual([]);
    expect(searchBundledDays(REFERENCE_DAYS, 'frustration')).toEqual([]);
  });

  test('snippets split into text runs and never become markup', () => {
    expect(snippetRuns('a <mark>b</mark> <script>x</script>')).toEqual([
      {text: 'a ', mark: false},
      {text: 'b', mark: true},
      {text: ' <script>x</script>', mark: false},
    ]);
  });
});
