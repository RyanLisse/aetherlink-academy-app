import {useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import type {SearchHit} from '@academy/actions';
import {Deck} from '@academy/deck';
import {LanguageToggle, useI18n} from '../i18n.tsx';
import {dayPath, REFERENCE_DAYS, slideAnchor, type ReferenceDay} from './days.ts';
import {bundledSearch, snippetRuns, type ReferenceSearch} from './search.ts';
import './reference.css';

/** Kept local: the shared catalogs in `@academy/i18n` are byte copies of the legacy files. */
const COPY = {
  en: {
    title: 'Reference',
    days: 'Days',
    glossary: 'Glossary',
    day: 'Day',
    slides: 'slides',
    searchLabel: 'Search lessons, slides and assignments',
    searchButton: 'Search',
    results: 'Results',
    noResults: 'No results.',
    bundledNotice: 'Searches the course text bundled with this page.',
    glossaryEmpty: 'No glossary has been imported for this course yet. Terms appear here once the curriculum importer provides them.',
  },
  nl: {
    title: 'Naslag',
    days: 'Dagen',
    glossary: 'Woordenlijst',
    day: 'Dag',
    slides: 'slides',
    searchLabel: 'Zoek in lessen, slides en opdrachten',
    searchButton: 'Zoeken',
    results: 'Resultaten',
    noResults: 'Geen resultaten.',
    bundledNotice: 'Zoekt in de cursustekst die met deze pagina is meegeleverd.',
    glossaryEmpty: 'Voor deze cursus is nog geen woordenlijst geïmporteerd. Termen verschijnen hier zodra de curriculum-importer ze levert.',
  },
} as const;

export type ReferencePage = {readonly kind: 'index'} | {readonly kind: 'day'; readonly day: ReferenceDay} | {readonly kind: 'glossary'};

export function matchReference(pathname: string): ReferencePage | null {
  if (pathname === '/reference' || pathname === '/reference/') return {kind: 'index'};
  if (pathname === '/reference/glossary') return {kind: 'glossary'};
  const match = /^\/reference\/day\/(\d+)$/.exec(pathname);
  const day = match ? REFERENCE_DAYS.find((entry) => entry.day === Number(match[1])) : undefined;
  return day ? {kind: 'day', day} : null;
}

export interface ReferenceViewProps {
  readonly page: ReferencePage;
  readonly navigate: (path: string) => void;
  /** Defaults to the bundled-deck fallback until an authenticated `search_content` endpoint is served. */
  readonly search?: ReferenceSearch;
  readonly anchor?: string | null;
}

export function ReferenceView({page, navigate, search, anchor = null}: ReferenceViewProps) {
  const {locale} = useI18n();
  const copy = COPY[locale];
  const runSearch = useMemo(() => search ?? bundledSearch(REFERENCE_DAYS), [search]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ReadonlyArray<SearchHit> | null>(null);

  const submit = async (value: string) => {
    const trimmed = value.trim();
    setHits(trimmed ? await runSearch(trimmed, locale) : null);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(query);
  };

  const link = (path: string) => ({
    href: path,
    onClick: (event: {preventDefault: () => void}) => {
      event.preventDefault();
      navigate(path);
    },
  });

  return (
    <div className="reference" data-locale={locale}>
      <header className="reference-bar">
        <a className="reference-home" {...link('/reference')}>{copy.title}</a>
        <nav aria-label={copy.days}>
          {REFERENCE_DAYS.map((day) => (
            <a key={day.day} {...link(dayPath(day.day))} aria-current={page.kind === 'day' && page.day.day === day.day ? 'page' : undefined}>
              {copy.day} {day.day}
            </a>
          ))}
          <a {...link('/reference/glossary')} aria-current={page.kind === 'glossary' ? 'page' : undefined}>{copy.glossary}</a>
        </nav>
        <LanguageToggle />
      </header>

      <form className="reference-search" role="search" onSubmit={onSubmit}>
        <label htmlFor="reference-query">{copy.searchLabel}</label>
        <div>
          <input id="reference-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit">{copy.searchButton}</button>
        </div>
        {!search && <p className="reference-notice">{copy.bundledNotice}</p>}
      </form>

      {hits !== null && (
        <section className="reference-results" aria-label={copy.results}>
          {hits.length === 0 ? (
            <p>{copy.noResults}</p>
          ) : (
            <ol>
              {hits.map((hit, index) => (
                <li key={`${hit.type}-${hit.slideAnchor ?? hit.title}-${index}`}>
                  <a {...link(hit.day === null ? '/reference/glossary' : dayPath(hit.day, hit.slideAnchor))}>
                    <span className="reference-hit-meta">
                      {hit.day === null ? copy.glossary : `${copy.day} ${hit.day}`}
                      {hit.lessonTitle ? ` · ${hit.lessonTitle}` : ''}
                    </span>
                    <strong>{hit.title}</strong>
                  </a>
                  <p className="reference-snippet">
                    {snippetRuns(hit.snippet).map((run, runIndex) => (run.mark ? <mark key={runIndex}>{run.text}</mark> : <span key={runIndex}>{run.text}</span>))}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {page.kind === 'index' && (
        <ul className="reference-days">
          {REFERENCE_DAYS.map((day) => (
            <li key={day.day}>
              <a {...link(dayPath(day.day))}>
                <span className="reference-hit-meta">{copy.day} {day.day}</span>
                <strong>{day.label}</strong>
                <span>{day.slides.length} {copy.slides}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {page.kind === 'glossary' && (
        <section className="reference-glossary" aria-label={copy.glossary}>
          <h1>{copy.glossary}</h1>
          <p>{copy.glossaryEmpty}</p>
        </section>
      )}
      {page.kind === 'day' && <ReferenceDayReader day={page.day} anchor={anchor} />}
    </div>
  );
}

/**
 * Renders the day through the deck's `reader` mode. Reader articles carry no
 * ids, so anchors are attached here by position (reader order = day order).
 */
export function ReferenceDayReader({day, anchor}: {readonly day: ReferenceDay; readonly anchor: string | null}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const articles = containerRef.current?.querySelectorAll<HTMLElement>('.reader-lesson > article') ?? [];
    articles.forEach((article, position) => {
      const slide = day.slides[position];
      if (!slide) return;
      article.id = slideAnchor(slide);
      article.toggleAttribute('data-anchored', article.id === anchor);
    });
  });

  useEffect(() => {
    const target = anchor ? document.getElementById(anchor) : null;
    if (target) target.scrollIntoView({block: 'start'});
    else window.scrollTo({top: 0});
  }, [day, anchor]);

  return (
    <div ref={containerRef} className="reference-reader" data-day={day.day}>
      <Deck slides={day.slides} index={index} revealStep={-1} mode="reader" onIndexChange={setIndex} onRevealStepChange={() => {}} />
    </div>
  );
}
