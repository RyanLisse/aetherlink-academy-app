import {useEffect, useState} from 'react';
import {LanguageToggle, useI18n} from '../i18n.tsx';
import {ReferenceDayReader} from '../reference/ReferenceView.tsx';
import {archiveDeckPath, findArchiveDeck, loadTrainingSiteArchive, type ArchiveCatalog, type ArchivePage} from './archive.ts';
import './archive.css';

const COPY = {
  en: {
    title: 'Archive',
    squad: 'Squad',
    day: 'Day',
    slides: 'slides',
    notice: 'Archived course version. These are the historical Squad 1 and Squad 2 decks from the old training site, kept for reading. They are not the current 7-day course.',
    source: 'Source',
    guide: 'Original trainer guide',
    loading: 'Loading archive…',
    failed: 'The archive could not be loaded.',
    missing: 'This squad and day are not in the archive.',
    current: 'Current course',
  },
  nl: {
    title: 'Archief',
    squad: 'Squad',
    day: 'Dag',
    slides: 'slides',
    notice: 'Gearchiveerde cursusversie. Dit zijn de historische decks van Squad 1 en Squad 2 van de oude trainingssite, bewaard om na te lezen. Het is niet de huidige 7-daagse cursus.',
    source: 'Bron',
    guide: 'Oorspronkelijke trainershandleiding',
    loading: 'Archief laden…',
    failed: 'Het archief kon niet worden geladen.',
    missing: 'Deze squad en dag staan niet in het archief.',
    current: 'Huidige cursus',
  },
} as const;

type LoadState = {readonly kind: 'loading'} | {readonly kind: 'failed'} | {readonly kind: 'ready'; readonly catalog: ArchiveCatalog};

export interface ArchiveViewProps {
  readonly page: ArchivePage;
  readonly navigate: (path: string) => void;
  readonly anchor?: string | null;
  /** Injected in tests; the route loads the generated archive JSON as its own chunk. */
  readonly catalog?: ArchiveCatalog;
}

export function ArchiveView({page, navigate, anchor = null, catalog}: ArchiveViewProps) {
  const {locale} = useI18n();
  const copy = COPY[locale];
  const [state, setState] = useState<LoadState>(catalog ? {kind: 'ready', catalog} : {kind: 'loading'});

  useEffect(() => {
    if (catalog) return;
    let cancelled = false;
    loadTrainingSiteArchive().then(
      (loaded) => !cancelled && setState({kind: 'ready', catalog: loaded}),
      () => !cancelled && setState({kind: 'failed'}),
    );
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const link = (path: string) => ({
    href: path,
    onClick: (event: {preventDefault: () => void}) => {
      event.preventDefault();
      navigate(path);
    },
  });

  if (state.kind !== 'ready') {
    return (
      <div className="reference archive">
        <p className="archive-status" role="status">{state.kind === 'loading' ? copy.loading : copy.failed}</p>
      </div>
    );
  }

  const {decks, origin, courseVersion} = state.catalog;
  const deck = page.kind === 'deck' ? findArchiveDeck(state.catalog, page.squad, page.day) : undefined;
  const squads = [...new Set(decks.map((entry) => entry.squad))];
  const commitUrl = `https://github.com/${origin.repo}/tree/${origin.commit}`;

  return (
    <div className="reference archive" data-locale={locale} data-course-version={courseVersion}>
      <header className="reference-bar">
        <a className="reference-home" {...link('/archive')}>{copy.title}</a>
        <nav aria-label={copy.title}>
          {decks.map((entry) => (
            <a key={entry.lessonId} {...link(archiveDeckPath(entry.squad, entry.day))} aria-current={entry === deck ? 'page' : undefined}>
              S{entry.squad} · {copy.day} {entry.day}
            </a>
          ))}
          <a {...link('/reference')}>{copy.current}</a>
        </nav>
        <LanguageToggle />
      </header>

      <p className="archive-notice" role="note">
        <strong>{courseVersion}</strong> {copy.notice} {copy.source}: <a href={commitUrl}>{origin.repo} @ {origin.commit.slice(0, 7)}</a>
      </p>

      {page.kind === 'index' &&
        squads.map((squad) => (
          <section key={squad} className="archive-squad" aria-label={`${copy.squad} ${squad}`}>
            <h2>{copy.squad} {squad}</h2>
            <ul className="reference-days">
              {decks
                .filter((entry) => entry.squad === squad)
                .map((entry) => (
                  <li key={entry.lessonId}>
                    <a {...link(archiveDeckPath(entry.squad, entry.day))}>
                      <span className="reference-hit-meta">{copy.squad} {entry.squad} · {copy.day} {entry.day}</span>
                      <strong>{entry.title}</strong>
                      <span>{entry.slides.length} {copy.slides}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}

      {page.kind === 'deck' && !deck && <p className="archive-status">{copy.missing}</p>}
      {deck && (
        <>
          <h1 className="archive-title">{deck.title}</h1>
          {deck.guideUrl && (
            <p className="archive-guide">
              <a href={deck.guideUrl}>{copy.guide}</a>
            </p>
          )}
          <ReferenceDayReader day={deck} anchor={anchor} />
        </>
      )}
    </div>
  );
}
