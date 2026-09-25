/**
 * Legacy site → Academy redirect map. Pure and import-free: the legacy gateway (`server/app.mjs`) imports this file
 * directly to answer `/legacy-redirect` with a 301, and the stubs published on the old sites send every visitor there.
 */

export type LegacySite = 'training-site' | 'classroom-slides';

export const LEGACY_SITES: ReadonlyArray<LegacySite> = ['training-site', 'classroom-slides'];

/** Classroom 1 owns deck slides 1..44 of the synced 91-slide classroom deck; Classroom 2 the rest. */
export const CLASSROOM_1_SLIDE_COUNT = 44;

type LegacyTarget =
  | {readonly kind: 'page'; readonly path: string}
  | {readonly kind: 'archive-deck'; readonly squad: 1 | 2; readonly day: number}
  | {readonly kind: 'classroom-deck'; readonly presenter: boolean};

export interface LegacyRule {
  readonly site: LegacySite;
  /** Old URL relative to the old site root, as a visitor would have bookmarked it. */
  readonly from: string;
  readonly to: LegacyTarget;
}

const archiveDay = (squad: 1 | 2, day: number): LegacyRule => ({
  site: 'training-site',
  from: `/?squad=${squad}&day=${day}`,
  to: {kind: 'archive-deck', squad, day},
});

export const LEGACY_RULES: ReadonlyArray<LegacyRule> = [
  {site: 'training-site', from: '/', to: {kind: 'page', path: '/archive'}},
  ...[1, 2, 3, 4, 5].map((day) => archiveDay(1, day)),
  ...[1, 2, 3, 4, 5].map((day) => archiveDay(2, day)),
  {site: 'training-site', from: '/?lesson=daily-brief', to: {kind: 'page', path: '/workshop/4'}},
  {site: 'training-site', from: '/glossary.html', to: {kind: 'page', path: '/reference/glossary'}},
  {site: 'classroom-slides', from: '/', to: {kind: 'classroom-deck', presenter: false}},
  {site: 'classroom-slides', from: '/presenter.html', to: {kind: 'classroom-deck', presenter: true}},
];

const FALLBACK: Record<LegacySite, string> = {'training-site': '/archive', 'classroom-slides': '/classroom/1'};

/** The old sites only ever read these query keys; anything else (cache busters, trackers) is ignored. */
const ROUTING_KEYS = ['squad', 'day', 'lesson'];

const ruleKey = (site: LegacySite, url: URL): string => {
  const path = url.pathname === '' || url.pathname === '/index.html' ? '/' : url.pathname;
  const query = ROUTING_KEYS.flatMap((key) => (url.searchParams.has(key) ? [`${key}=${url.searchParams.get(key)}`] : [])).join('&');
  return `${site} ${path}${query ? `?${query}` : ''}`;
};

const RULES_BY_KEY = new Map(LEGACY_RULES.map((rule) => [ruleKey(rule.site, new URL(rule.from, 'https://legacy.invalid')), rule]));

const hashSlide = (hash: string): number | null => {
  const n = Number(hash.slice(1));
  return Number.isInteger(n) && n >= 1 ? n : null;
};

const targetPath = (target: LegacyTarget, hash: string): string => {
  const slide = hashSlide(hash);
  switch (target.kind) {
    case 'page':
      return target.path;
    case 'archive-deck': {
      const lessonId = `archive-s${target.squad}-day${target.day}`;
      return `/archive/squad-${target.squad}/day-${target.day}${slide ? `#slide-${lessonId}-${slide}` : ''}`;
    }
    case 'classroom-deck': {
      const n = slide ?? 1;
      const classroom = n <= CLASSROOM_1_SLIDE_COUNT ? 1 : 2;
      const index = classroom === 1 ? n - 1 : n - CLASSROOM_1_SLIDE_COUNT - 1;
      const params = [...(index > 0 ? [`index=${index}`] : []), ...(target.presenter ? ['mode=presenter'] : [])];
      return `/classroom/${classroom}${params.length ? `?${params.join('&')}` : ''}`;
    }
  }
};

export const isLegacySite = (value: unknown): value is LegacySite => LEGACY_SITES.includes(value as LegacySite);

/** Academy path for an old URL. `from` may be absolute (any host) or root-relative; unknown paths land on the site's fallback. */
export const resolveLegacyUrl = (site: LegacySite, from: string): string => {
  let url: URL;
  try {
    url = new URL(from, 'https://legacy.invalid');
  } catch {
    return FALLBACK[site];
  }
  const rule = RULES_BY_KEY.get(ruleKey(site, url));
  return rule ? targetPath(rule.to, url.hash) : FALLBACK[site];
};

/** Static page for the old host: forwards the full address (hash included, which a server never sees) to `/legacy-redirect`. */
export const legacyStubHtml = (site: LegacySite, academyOrigin: string): string => {
  const endpoint = `${academyOrigin}/legacy-redirect?site=${site}&from=`;
  const fallback = `${academyOrigin}${FALLBACK[site]}`;
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Verhuisd naar AetherLink Academy</title>
<script>location.replace(${JSON.stringify(endpoint)} + encodeURIComponent(location.href));</script>
<noscript><meta http-equiv="refresh" content="0; url=${fallback}"></noscript>
</head>
<body>
<p>Deze pagina is verhuisd naar <a href="${fallback}">${fallback}</a>.</p>
</body>
</html>
`;
};
