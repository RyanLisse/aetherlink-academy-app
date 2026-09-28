import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isValidSimId, parseScenario, parseSimRefs} from '../packages/concept-sim/src/index.ts';

const DEFAULT_DIR = fileURLToPath(new URL('../content/sims/', import.meta.url));

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
    const scenario = parseScenario(raw, id);
    if (scenario.version !== id) {
      // Allow version aliasing but prefer filename as catalog id.
    }
    catalog.set(id, scenario);
  }
  return catalog;
}

const catalog = loadSimCatalog();

export function getSim(id) {
  return catalog.get(id) ?? null;
}

export function listSims() {
  return [...catalog.entries()].map(([id, scenario]) => ({
    id,
    title: scenario.title,
    description: scenario.description,
    steps: scenario.steps.length,
  }));
}

/**
 * Resolve day-pack `sims` refs to full scenarios for the Lesson player.
 * Unknown ids fail at serve time so content drift is loud.
 */
export function resolvePackSims(raw, {at = 'sims'} = {}) {
  const refs = parseSimRefs(raw, at);
  return refs.map((ref) => {
    const scenario = getSim(ref.id);
    if (!scenario) throw new Error(`${at}: unknown sim id "${ref.id}"`);
    return {
      id: ref.id,
      title: ref.title || scenario.title,
      description: scenario.description,
      steps: scenario.steps,
      ...(scenario.attribution ? {attribution: scenario.attribution} : {}),
    };
  });
}
