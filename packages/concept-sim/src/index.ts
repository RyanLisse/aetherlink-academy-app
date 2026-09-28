/**
 * Concept step-through simulator — scenario schema + validators.
 *
 * Scenario JSON shape is compatible with shareAI-lab/learn-claude-code
 * `web/src/data/scenarios/*.json` (MIT, Copyright 2024 shareAI Lab).
 * Academy ports scenarios into `content/sims/` with attribution retained.
 *
 * Locale lock (AET-116): harness chapters ship `locales:{en,nl}`; flat
 * single-locale fixtures (Slice 0) remain valid as EN-only surface proofs.
 */

export const SIM_STEP_TYPES = [
  'user_message',
  'assistant_text',
  'tool_call',
  'tool_result',
  'system_event',
] as const;

export const CONTENT_LOCALES = ['en', 'nl'] as const;

export type SimStepType = (typeof SIM_STEP_TYPES)[number];
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export interface SimStep {
  type: SimStepType;
  content: string;
  annotation: string;
  toolName?: string;
  toolInput?: string;
}

export interface Scenario {
  version: string;
  title: string;
  description: string;
  steps: SimStep[];
  /** Optional MIT / source notice shown in the player footer. */
  attribution?: string;
  /** Locale this projection was built for. */
  locale?: ContentLocale;
}

export interface LocalizedScenario {
  version: string;
  attribution?: string;
  /** Present for bilingual chapters; EN always required when locales is set. */
  locales: Partial<Record<ContentLocale, Omit<Scenario, 'version' | 'attribution' | 'locale'>>>;
}

export interface SimRef {
  id: string;
  title?: string;
}

const ID_RE = /^[a-z][a-z0-9_-]{0,63}$/;

export function isSimStepType(value: unknown): value is SimStepType {
  return typeof value === 'string' && (SIM_STEP_TYPES as readonly string[]).includes(value);
}

export function normalizeContentLocale(raw: unknown): ContentLocale {
  return raw === 'en' ? 'en' : 'nl';
}

export function parseSimStep(raw: unknown, at = 'step'): SimStep {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${at}: expected object`);
  const step = raw as Record<string, unknown>;
  if (!isSimStepType(step.type)) throw new Error(`${at}: invalid type`);
  if (typeof step.content !== 'string') throw new Error(`${at}: content must be string`);
  if (typeof step.annotation !== 'string') throw new Error(`${at}: annotation must be string`);
  const out: SimStep = {
    type: step.type,
    content: step.content,
    annotation: step.annotation,
  };
  if (step.toolName !== undefined) {
    if (typeof step.toolName !== 'string') throw new Error(`${at}: toolName must be string`);
    out.toolName = step.toolName;
  }
  if (step.toolInput !== undefined) {
    if (typeof step.toolInput !== 'string') throw new Error(`${at}: toolInput must be string`);
    out.toolInput = step.toolInput;
  }
  return out;
}

function parseScenarioBody(raw: Record<string, unknown>, at: string) {
  if (typeof raw.title !== 'string' || !raw.title.trim()) throw new Error(`${at}: title required`);
  if (typeof raw.description !== 'string') throw new Error(`${at}: description must be string`);
  if (!Array.isArray(raw.steps) || raw.steps.length < 1) throw new Error(`${at}: steps must be a non-empty array`);
  return {
    title: raw.title.trim(),
    description: raw.description,
    steps: raw.steps.map((step, i) => parseSimStep(step, `${at}.steps[${i}]`)),
  };
}

/** Parse flat (legacy/fixture) or localized scenario documents. */
export function parseLocalizedScenario(raw: unknown, at = 'scenario'): LocalizedScenario {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${at}: expected object`);
  const s = raw as Record<string, unknown>;
  if (typeof s.version !== 'string' || !s.version.trim()) throw new Error(`${at}: version required`);
  const version = s.version.trim();
  let attribution: string | undefined;
  if (s.attribution !== undefined) {
    if (typeof s.attribution !== 'string') throw new Error(`${at}: attribution must be string`);
    attribution = s.attribution;
  }

  if (s.locales && typeof s.locales === 'object' && !Array.isArray(s.locales)) {
    const localesRaw = s.locales as Record<string, unknown>;
    const locales: LocalizedScenario['locales'] = {};
    for (const lang of CONTENT_LOCALES) {
      if (localesRaw[lang] === undefined) continue;
      if (!localesRaw[lang] || typeof localesRaw[lang] !== 'object' || Array.isArray(localesRaw[lang])) {
        throw new Error(`${at}.locales.${lang}: expected object`);
      }
      locales[lang] = parseScenarioBody(localesRaw[lang] as Record<string, unknown>, `${at}.locales.${lang}`);
    }
    if (!locales.en) throw new Error(`${at}.locales.en required when locales is set`);
    return {
      version,
      locales,
      ...(attribution !== undefined ? {attribution} : {}),
    };
  }

  // Flat fixture shape → treat as EN-only
  const body = parseScenarioBody(s, at);
  return {
    version,
    locales: {en: body},
    ...(attribution !== undefined ? {attribution} : {}),
  };
}

/** Project a catalog entry to a concrete Scenario for one UI locale. */
export function projectScenario(localized: LocalizedScenario, locale: unknown = 'en'): Scenario {
  const lang = normalizeContentLocale(locale);
  const body = localized.locales[lang] || localized.locales.en;
  if (!body) throw new Error(`scenario ${localized.version}: no content for locale ${lang}`);
  return {
    version: localized.version,
    title: body.title,
    description: body.description,
    steps: body.steps,
    locale: localized.locales[lang] ? lang : 'en',
    ...(localized.attribution ? {attribution: localized.attribution} : {}),
  };
}

/** Back-compat: parse + project to EN (fixtures / older callers). */
export function parseScenario(raw: unknown, at = 'scenario'): Scenario {
  return projectScenario(parseLocalizedScenario(raw, at), 'en');
}

export function assertScenarioLocaleComplete(localized: LocalizedScenario, at = 'scenario') {
  for (const lang of CONTENT_LOCALES) {
    if (!localized.locales[lang]) throw new Error(`${at}: missing locales.${lang}`);
  }
  const en = JSON.stringify(localized.locales.en!.steps.map((s) => s.content + s.annotation));
  const nl = JSON.stringify(localized.locales.nl!.steps.map((s) => s.content + s.annotation));
  if (en === nl) throw new Error(`${at}: locales.nl must differ from locales.en (no silent EN leak)`);
  const blob = JSON.stringify(localized.locales.nl);
  if (/\[PLACEHOLDER\]|\[NL\]|lorem ipsum|\bTODO:|\bFIXME:/i.test(blob)) {
    throw new Error(`${at}: locales.nl looks like a placeholder`);
  }
}

/** Normalize day-pack `sims` declarations: string id or {id, title?}. */
export function parseSimRefs(raw: unknown, at = 'sims'): SimRef[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${at}: expected array`);
  return raw.map((item, i) => {
    const loc = `${at}[${i}]`;
    if (typeof item === 'string') {
      if (!ID_RE.test(item)) throw new Error(`${loc}: invalid id`);
      return {id: item};
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${loc}: expected id or object`);
    const ref = item as Record<string, unknown>;
    if (typeof ref.id !== 'string' || !ID_RE.test(ref.id)) throw new Error(`${loc}: invalid id`);
    const out: SimRef = {id: ref.id};
    if (ref.title !== undefined) {
      if (typeof ref.title !== 'string') throw new Error(`${loc}: title must be string`);
      out.title = ref.title;
    }
    return out;
  });
}

export function isValidSimId(id: string): boolean {
  return ID_RE.test(id);
}
