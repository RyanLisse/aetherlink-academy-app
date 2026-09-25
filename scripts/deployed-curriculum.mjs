import {FAIL, PASS, UNAVAILABLE, exitCodeFor, snapshot} from './deployed-smoke-checks.mjs';

export const CURRICULUM = [
  {day: 1, track: 'classroom', route: '/classroom/1'},
  {day: 2, track: 'classroom', route: '/classroom/2'},
  {day: 3, track: 'workshop', route: '/workshop/3'},
  {day: 4, track: 'workshop', route: '/workshop/4'},
  {day: 5, track: 'workshop', route: '/workshop/5'},
  {day: 6, track: 'workshop', route: '/workshop/6'},
  {day: 7, track: 'workshop', route: '/workshop/7'},
];

export const moduleScripts = html => [
  ...html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g),
  ...html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g),
].map(match => match[1]);

// server/app.mjs answers every /classroom/* and /workshop/* path with the same
// apps/web shell, so a 200 proves nothing about a day. The day exists only if
// the shipped bundle routes it, which leaves the path as a string literal.
export function evaluateCurriculumDay({day, track, route}, page, bundle) {
  const name = `curriculum_day_${day}_${track}`;
  if (page.status !== 200) return {name, status: FAIL, detail: `${route} HTTP ${page.status}: ${page.body.slice(0, 80)}`};
  if (!/id="root"/.test(page.body) || !moduleScripts(page.body).length)
    return {name, status: FAIL, detail: `${route} did not return the apps/web shell`};
  if (!['"', "'", '`'].some(quote => bundle.includes(`${quote}${route}${quote}`)))
    return {name, status: UNAVAILABLE, detail: `not yet available: the deployed apps/web bundle has no ${route} route`};
  return {name, status: PASS, detail: `${route} served by the apps/web bundle`};
}

export async function probeCurriculum(base, fetchImpl = fetch) {
  const get = async url => snapshot(await fetchImpl(new URL(url, base), {redirect: 'manual', signal: AbortSignal.timeout(30_000)}));
  const bundles = new Map();
  const bundleFor = async page => {
    const parts = [];
    for (const src of moduleScripts(page.body)) {
      if (!bundles.has(src)) bundles.set(src, get(src).then(asset => {
        if (asset.status !== 200) throw Error(`bundle ${src} HTTP ${asset.status}`);
        return asset.body;
      }));
      parts.push(await bundles.get(src));
    }
    return parts.join('\n');
  };
  const results = [];
  for (const day of CURRICULUM) {
    try {
      const page = await get(day.route);
      results.push(evaluateCurriculumDay(day, page, page.status === 200 ? await bundleFor(page) : ''));
    } catch (error) {
      results.push({name: `curriculum_day_${day.day}_${day.track}`, status: FAIL, detail: `${day.route}: ${error.message}`});
    }
  }
  return results;
}

if (import.meta.main) {
  let base;
  try { base = new URL(process.argv[2] || process.env.ACADEMY_URL); } catch {
    console.error('Usage: node scripts/deployed-curriculum.mjs <academy-origin>');
    process.exit(1);
  }
  const results = await probeCurriculum(base);
  for (const r of results) console.log(`${{pass: 'PASS', fail: 'FAIL', unavailable: 'OPEN'}[r.status]} ${r.name}: ${r.detail}`);
  process.exitCode = exitCodeFor(results);
}
