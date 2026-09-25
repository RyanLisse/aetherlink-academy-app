import {useEffect, useState, type ReactNode} from 'react';
import {LanguageToggle, useI18n} from './i18n.tsx';
import {Deck, type DeckMode} from '@academy/deck';
import {LiveClassroom} from './live/LiveClassroom.tsx';
import {SquadPanel} from './squad/SquadPanel.tsx';
import {FacilitatorReleasePanel} from './release/FacilitatorReleasePanel.tsx';
import {EvidencePanel, FacilitatorOverview} from './evidence/index.ts';
import {sourceSlides} from './deck/slides.js';
import {workshop5SourceSlides} from './deck/workshop5-slides.js';
import {workshop3SourceSlides} from './deck/workshop3-slides.js';
import {workshop4SourceSlides} from './deck/workshop4-slides.js';
import {workshop6SourceSlides} from './deck/workshop6-slides.js';
import {workshop7SourceSlides} from './deck/workshop7-slides.js';
import {normalizeSlides} from './deck/normalize.js';
import {matchReference, ReferenceView} from './reference/index.ts';
import {matchArchive} from './archive/archive.ts';
import {ArchiveView} from './archive/ArchiveView.tsx';
import './deck/deck.css';
import {AuthoringPage} from './authoring/AuthoringPage.tsx';

export type RouteId = 'squad' | 'route' | 'lesson' | 'solo' | 'coach' | 'review' | 'connection' | 'authoring';

export interface RouteDef {
  readonly id: RouteId;
  readonly path: string;
  readonly labelKey: string;
}

export const ROUTES: ReadonlyArray<RouteDef> = [
  {id: 'squad', path: '/', labelKey: 'nav.squad'},
  {id: 'route', path: '/route', labelKey: 'nav.route'},
  {id: 'lesson', path: '/lesson', labelKey: 'nav.lesson'},
  {id: 'solo', path: '/solo', labelKey: 'nav.solo'},
  {id: 'coach', path: '/coach', labelKey: 'nav.coach'},
  {id: 'review', path: '/review', labelKey: 'nav.review'},
  {id: 'connection', path: '/connection-status', labelKey: 'connection.status'},
];

const AUTHORING_ROUTE: RouteDef = {id: 'authoring', path: '/authoring', labelKey: 'authoring.title'};

export function matchRoute(pathname: string): RouteDef {
  if (pathname === AUTHORING_ROUTE.path) return AUTHORING_ROUTE;
  return ROUTES.find((route) => route.path === pathname) ?? ROUTES[0]!;
}

interface ProbeView {
  readonly reachable: boolean;
  readonly latencyMs: number;
  readonly error: string | null;
}

export interface ConnectionView {
  readonly postgres: ProbeView;
  readonly redis: ProbeView;
  readonly proof: ProbeView;
  readonly checkedAt: string;
}

export type ConnectionState =
  | {readonly kind: 'loading'}
  | {readonly kind: 'unreachable'; readonly error: string}
  | {readonly kind: 'ready'; readonly report: ConnectionView};

export type ConnectionFetcher = () => Promise<ConnectionState>;

export const fetchConnection: ConnectionFetcher = async () => {
  try {
    const response = await fetch('/connection', {signal: AbortSignal.timeout(5000)});
    if (!response.ok) return {kind: 'unreachable', error: `HTTP ${response.status}`};
    return {kind: 'ready', report: (await response.json()) as ConnectionView};
  } catch (error) {
    return {kind: 'unreachable', error: error instanceof Error ? error.message : String(error)};
  }
};

export interface ShellProps {
  readonly pathname: string;
  readonly navigate: (path: string) => void;
  readonly connection: ConnectionState;
}

export function Shell({pathname, navigate, connection}: ShellProps) {
  const {t, locale} = useI18n();
  const active = matchRoute(pathname);
  return (
    <div className="shell" data-locale={locale}>
      <aside className="sidebar">
        <div className="brand">{t('brand.academy')}</div>
        <p className="tagline">
          {t('nav.tagline1')} {t('nav.tagline2')} {t('nav.tagline3')}
        </p>
        <nav aria-label={t('nav.main')}>
          <ul>
            {ROUTES.map((route) => (
              <li key={route.id}>
                <a
                  href={route.path}
                  aria-current={route.id === active.id ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(route.path);
                  }}
                >
                  {t(route.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="schedule">{t('nav.schedule')}</p>
      </aside>
      <main>
        <header className="topbar">
          <h1>{t(active.labelKey)}</h1>
          <LanguageToggle />
        </header>
        <section className="panel">
          {active.id === 'connection' ? (
            <ConnectionPanel state={connection} />
          ) : active.id === 'squad' ? (
            <SquadPanel />
          ) : active.id === 'coach' ? (
            <>
              <FacilitatorReleasePanel />
              <FacilitatorOverview />
            </>
          ) : active.id === 'review' || active.id === 'solo' || active.id === 'route' ? (
            <EvidencePanel />
          ) : (
            <Placeholder route={active} />
          )}
        </section>
        <footer>{t('room.footer')}</footer>
      </main>
    </div>
  );
}

function Placeholder({route}: {readonly route: RouteDef}) {
  const {t} = useI18n();
  return (
    <div className="placeholder" data-route={route.id}>
      <p className="eyebrow">{t('route.eyebrow')}</p>
      <p>{t('route.lede')}</p>
    </div>
  );
}

export function ConnectionPanel({state}: {readonly state: ConnectionState}) {
  const {t} = useI18n();
  if (state.kind === 'loading') return <p className="status">{t('common.loading')}</p>;
  if (state.kind === 'unreachable') {
    return (
      <p className="status status-bad" role="status">
        {t('account.disconnected')} · {state.error}
      </p>
    );
  }
  const rows: ReadonlyArray<[string, ProbeView]> = [
    ['Postgres', state.report.postgres],
    ['Redis', state.report.redis],
    ['Proof', state.report.proof],
  ];
  return (
    <table className="connection">
      <tbody>
        {rows.map(([name, probe]) => (
          <tr key={name} data-reachable={probe.reachable}>
            <th scope="row">{name}</th>
            <td>{probe.reachable ? t('overview.online') : t('overview.offline')}</td>
            <td>{probe.latencyMs} ms</td>
            <td>{probe.error ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function useConnection(fetcher: ConnectionFetcher, intervalMs = 5000, enabled = true): ConnectionState {
  const [state, setState] = useState<ConnectionState>({kind: 'loading'});
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = async () => {
      const next = await fetcher();
      if (!cancelled) setState(next);
    };
    void tick();
    const timer = setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fetcher, intervalMs, enabled]);
  return state;
}

export function usePathname(): [string, (path: string) => void] {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setPathname(path);
  };
  return [pathname, navigate];
}

export function AppRoutes({children}: {readonly children?: ReactNode}) {
  const [pathname, navigate] = usePathname();
  const [referencePath = '', referenceAnchor] = pathname.split('#');
  const reference = matchReference(referencePath);
  const archive = matchArchive(referencePath);
  const deckLike = reference !== null || archive !== null || pathname === '/deck' || isClassroom1Path(pathname) || isClassroom2Path(pathname) || isWorkshop5Path(pathname) || isWorkshop3Path(pathname) || isWorkshop4Path(pathname) || isWorkshop6Path(pathname) || isWorkshop7Path(pathname) || pathname === '/authoring';
  const connection = useConnection(fetchConnection, 5000, !deckLike);
  if (reference) return <ReferenceView page={reference} navigate={navigate} anchor={referenceAnchor ?? (window.location.hash.slice(1) || null)} />;
  if (archive) return <ArchiveView page={archive} navigate={navigate} anchor={referenceAnchor ?? (window.location.hash.slice(1) || null)} />;
  if (pathname === '/deck') return <DeckDemo slides={DECK_SLIDES} />;
  if (pathname === '/authoring') return <AuthoringPage />;
  if (isClassroom1Path(pathname)) return <DeckDemo slides={CLASSROOM_1_SLIDES} />;
  if (isClassroom2Path(pathname)) return <DeckDemo slides={CLASSROOM_2_SLIDES} />;
  if (isWorkshop5Path(pathname)) return <DeckDemo slides={WORKSHOP_5_SLIDES} />;
  if (isWorkshop3Path(pathname)) return <DeckDemo slides={WORKSHOP_3_SLIDES} />;
  if (isWorkshop4Path(pathname)) return <DeckDemo slides={WORKSHOP_4_SLIDES} />;
  if (isWorkshop6Path(pathname)) return <DeckDemo slides={WORKSHOP_6_SLIDES} />;
  if (isWorkshop7Path(pathname)) return <DeckDemo slides={WORKSHOP_7_SLIDES} />;
  if (pathname.startsWith('/live/')) return <LiveRoute pathname={pathname} />;
  return (
    <>
      <Shell pathname={pathname} navigate={navigate} connection={connection} />
      {children}
    </>
  );
}

/** Facilitator Classroom 1 entry — Teaching Day 1 deck only (not support-day packs). */
export function isClassroom1Path(pathname: string): boolean {
  return pathname === '/classroom/1' || pathname === '/lesson/classroom-1';
}

/** Facilitator Classroom 2 entry — Teaching Day 2 deck only (AET-76). */
export function isClassroom2Path(pathname: string): boolean {
  return pathname === '/classroom/2' || pathname === '/lesson/classroom-2';
}

/** Facilitator Workshop 5 entry — AI-native SDLC deck (AET-77). */
export function isWorkshop5Path(pathname: string): boolean {
  return pathname === '/workshop/5' || pathname === '/lesson/workshop-5';
}

/** Facilitator Workshop 3 entry — n8n ticket priority L1→L3 (AET-79). */
export function isWorkshop3Path(pathname: string): boolean {
  return pathname === '/workshop/3' || pathname === '/lesson/workshop-3';
}

/** Facilitator Workshop 4 entry — n8n → Claude Agent SDK rebuild (AET-80). */
export function isWorkshop4Path(pathname: string): boolean {
  return pathname === '/workshop/4' || pathname === '/lesson/workshop-4';
}

/** Facilitator Workshop 6 entry — eigen opdracht thin slice start (AET-81). */
export function isWorkshop6Path(pathname: string): boolean {
  return pathname === '/workshop/6' || pathname === '/lesson/workshop-6';
}

/** Facilitator Workshop 7 entry — eigen opdracht finish + present (AET-85). */
export function isWorkshop7Path(pathname: string): boolean {
  return pathname === '/workshop/7' || pathname === '/lesson/workshop-7';
}

const DECK_SLIDES = normalizeSlides(sourceSlides);
/** Classroom 1 product route: Teaching Day 1 only (SoT slides before the "TEACHING DAY 2" divider).
 *  Headroom only (AET-86 backlog — do not build here): Arcade postMessage embed slot,
 *  typed quiz schema, cohort continuity ≠ room code.
 */
const CLASSROOM_1_SLIDES = DECK_SLIDES.filter((slide) => slide.lessonId === 'teaching-day-1');
/** Classroom 2 product route: Teaching Day 2 only (from the "TEACHING DAY 2" divider on). Feeds Workshop 6–7. */
const CLASSROOM_2_SLIDES = DECK_SLIDES.filter((slide) => slide.lessonId === 'teaching-day-2');
/** Workshop 5 product route: AI-native SDLC day pack (AET-77). Separate module — not Classroom cut. */
const WORKSHOP_5_SLIDES = normalizeSlides(workshop5SourceSlides);
/** Workshop 3 product route: n8n L1→L3 ticket priority (AET-79). Separate module — not Classroom/W5 cut. */
const WORKSHOP_3_SLIDES = normalizeSlides(workshop3SourceSlides);
/** Workshop 4 product route: n8n → Claude Agent SDK SOLO 0→4 (AET-80). Separate module — not Classroom/W5/W3 cut. */
const WORKSHOP_4_SLIDES = normalizeSlides(workshop4SourceSlides);
/** Workshop 6 product route: eigen opdracht thin slice (AET-81). Separate module — not Classroom/W5/W3/W4 cut. */
const WORKSHOP_6_SLIDES = normalizeSlides(workshop6SourceSlides);
/** Workshop 7 product route: eigen opdracht finish + present (AET-85). Separate module — not Classroom/W5/W3/W4/W6 cut. */
const WORKSHOP_7_SLIDES = normalizeSlides(workshop7SourceSlides);
function DeckDemo({slides}: {readonly slides: typeof DECK_SLIDES}) {
  useEffect(() => {
    const surfaces = [document.documentElement, document.body];
    const previous = surfaces.map(({style}) => ({value: style.getPropertyValue('background-color'), priority: style.getPropertyPriority('background-color')}));
    surfaces.forEach(({style}) => style.setProperty('background-color', '#06111e'));
    return () => surfaces.forEach(({style}, index) => {
      const saved = previous[index]!;
      if (saved.value) style.setProperty('background-color', saved.value, saved.priority);
      else style.removeProperty('background-color');
    });
  }, []);
  const [index, setIndex] = useState(() => { const value = Number(new URLSearchParams(window.location.search).get('index')); return Number.isInteger(value) && value >= 0 && value < slides.length ? value : 0; });
  const [revealStep, setRevealStep] = useState(-1);
  const requested = new URLSearchParams(window.location.search).get('mode');
  const mode: DeckMode = requested === 'reader' || requested === 'presenter' || requested === 'follow' ? requested : 'projector';
  return <Deck slides={slides} index={index} revealStep={revealStep} mode={mode} presence={<span>Presence slot</span>} onIndexChange={(next) => { setIndex(next); setRevealStep(-1); }} onRevealStepChange={setRevealStep}/>;
}

function LiveRoute({pathname}: {readonly pathname: string}) {
  const parts = pathname.split('/').filter(Boolean);
  // /live/:roomId/:view  view = presenter|follow|projector
  const roomId = parts[1] ?? 'demo';
  const view = parts[2] ?? 'follow';
  const params = new URLSearchParams(window.location.search);
  const role = view === 'presenter' ? 'facilitator' : 'participant';
  const mode: DeckMode = view === 'presenter' ? 'presenter' : view === 'projector' ? 'projector' : 'follow';
  const participantId = params.get('id') ?? (role === 'facilitator' ? 'facilitator-1' : `participant-${Math.random().toString(36).slice(2, 8)}`);
  const name = params.get('name') ?? (role === 'facilitator' ? 'Facilitator' : participantId);
  return (
    <LiveClassroom
      roomId={roomId}
      role={role}
      mode={mode}
      slides={DECK_SLIDES}
      participantId={participantId}
      name={name}
    />
  );
}
