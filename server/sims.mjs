import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  isValidSimId,
  parseLocalizedScenario,
  parseSimRefs,
  projectScenario,
  assertScenarioLocaleComplete,
  normalizeContentLocale,
} from '../packages/concept-sim/src/index.ts';

const DEFAULT_DIR = fileURLToPath(new URL('../content/sims/', import.meta.url));

/** Harness chapter ids that must ship real EN+NL under the locale lock. */
const LOCALE_COMPLETE_IDS = new Set(['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12','s13','s14','s15','s16','s17','w5-sdlc-loop','w4-ticket-priority','sre-oncall-loop']);

/** Load and validate every `*.json` scenario under content/sims (boot-time). */
export function loadSimCatalog(dir = DEFAULT_DIR) {
  const catalog = new Map();
  let entries = [];
  try {
    entries = readdirSync(dir).filter((name) => name.endsWith('.json'));
  } catch (error) {
    if (error?.code === 'ENOENT') return catalog;
    throw error;
  }
  for (const name of entries) {
    const id = name.replace(/\.json$/, '');
    if (!isValidSimId(id)) throw new Error(`Invalid sim filename id: ${name}`);
    const raw = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
    const localized = parseLocalizedScenario(raw, id);
    if (localized.version !== id && localized.version !== raw.version) {
      // filename is catalog id; version may alias
    }
    if (LOCALE_COMPLETE_IDS.has(id)) {
      assertScenarioLocaleComplete(localized, id);
    }
    catalog.set(id, localized);
  }
  return catalog;
}

const catalog = loadSimCatalog();

export function getSimLocalized(id) {
  return catalog.get(id) ?? null;
}

export function getSim(id, locale = 'en') {
  const localized = catalog.get(id);
  if (!localized) return null;
  return projectScenario(localized, locale);
}

export function listSims(locale = 'en') {
  const lang = normalizeContentLocale(locale);
  return [...catalog.entries()].map(([id, localized]) => {
    const projected = projectScenario(localized, lang);
    return {
      id,
      title: projected.title,
      description: projected.description,
      steps: projected.steps.length,
      locales: Object.keys(localized.locales),
      localeComplete: Boolean(localized.locales.en && localized.locales.nl),
    };
  });
}

/**
 * Resolve day-pack `sims` refs to full scenarios for the Lesson player.
 * Unknown ids fail at serve time so content drift is loud.
 */
export function resolvePackSims(raw, {at = 'sims', locale = 'en'} = {}) {
  const refs = parseSimRefs(raw, at);
  const lang = normalizeContentLocale(locale);
  return refs.map((ref) => {
    const localized = getSimLocalized(ref.id);
    if (!localized) throw new Error(`${at}: unknown sim id "${ref.id}"`);
    const scenario = projectScenario(localized, lang);
    return {
      id: ref.id,
      title: ref.title || scenario.title,
      description: scenario.description,
      steps: scenario.steps,
      locale: scenario.locale,
      ...(scenario.attribution ? {attribution: scenario.attribution} : {}),
    };
  });
}
