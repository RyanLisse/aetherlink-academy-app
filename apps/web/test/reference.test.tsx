// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {describe, expect, test} from 'vitest';
import {I18nProvider} from '../src/i18n.tsx';
import {matchReference, REFERENCE_DAYS, ReferenceView, searchBundledDays, snippetRuns, type ReferencePage} from '../src/reference/index.ts';
import {filterGlossaryTerms, OfficialGlossaryEntries} from '../src/reference/ReferenceView.tsx';
import officialDocumentation from '../../../content/official-documentation.json' with {type: 'json'};

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
    expect(REFERENCE_DAYS.map((day) => [day.day, day.slides.length])).toEqual([[1, 67], [2, 46], [3, 18], [4, 16], [5, 48], [6, 14], [7, 14]]);
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

  test('the glossary renders course terms with links to official documentation', () => {
    const markup = render({kind: 'glossary'});
    expect(markup).toContain('Agent loop');
    expect(markup).toContain('Model Context Protocol (MCP)');
    expect(markup).toContain('https://code.claude.com/docs/en/how-claude-code-works');
    expect(markup).toContain('https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro');
    expect(markup).toContain('target="_blank" rel="noopener noreferrer"');
    expect(markup).not.toContain('No glossary has been imported');
    expect(render({kind: 'glossary'}, 'nl')).toContain('Cursusbegrippen met links naar primaire documentatie');
  });

  test('glossary terms are searchable and the catalog only links to primary official documentation', () => {
    expect(officialDocumentation.terms).toHaveLength(25);
    expect(filterGlossaryTerms(officialDocumentation.terms, 'mCp').map(({id}) => id)).toEqual(['mcp', 'mcp-tool']);
    expect(filterGlossaryTerms(officialDocumentation.terms, '  ')).toHaveLength(25);
    expect(filterGlossaryTerms(officialDocumentation.terms, 'no such term')).toEqual([]);

    const officialHosts = new Set(['code.claude.com', 'platform.claude.com', 'modelcontextprotocol.io', 'docs.n8n.io']);
    for (const entry of officialDocumentation.terms) {
      expect(entry.id).toBeTruthy();
      expect(entry.definition.length).toBeGreaterThan(20);
      expect(entry.chapterIds.length).toBeGreaterThan(0);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) {
        const url = new URL(source.url);
        expect(url.protocol).toBe('https:');
        expect(officialHosts.has(url.hostname)).toBe(true);
      }
    }
  });

  test('glossary text is rendered as text, not interpreted as injected markup', () => {
    const markup = renderToString(
      <OfficialGlossaryEntries terms={[{
        id: 'hostile', term: '<img src=x onerror=alert(1)>', definition: '<script>alert(1)</script>',
        sources: [{title: '<svg onload=alert(1)>', url: 'https://code.claude.com/docs/en/overview'}], chapterIds: ['s01'], days: [],
      }]} />,
    );
    expect(markup).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(markup).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(markup).not.toContain('<img src=x');
    expect(markup).not.toContain('<script>alert');
    expect(markup).toContain('rel="noopener noreferrer"');
  });
});

describe('bundled reference search', () => {
  test('hits link to the day and the slide anchor', () => {
    const [first] = searchBundledDays(REFERENCE_DAYS, '20 AI terms that matter');
    expect(first).toMatchObject({type: 'slide', day: 1, lessonId: 'teaching-day-1', slideAnchor: 'slide-teaching-day-1-51', title: 'Assignment 3: The 20 AI terms that matter'});
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
