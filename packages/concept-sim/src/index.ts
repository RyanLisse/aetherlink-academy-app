/**
 * Concept step-through simulator — scenario schema + validators.
 *
 * Scenario JSON shape is compatible with shareAI-lab/learn-claude-code
 * `web/src/data/scenarios/*.json` (MIT, Copyright 2024 shareAI Lab).
 * Academy ports scenarios into `content/sims/` with attribution retained.
 */

export const SIM_STEP_TYPES = [
  'user_message',
  'assistant_text',
  'tool_call',
  'tool_result',
  'system_event',
] as const;

export type SimStepType = (typeof SIM_STEP_TYPES)[number];

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
}

export interface SimRef {
  id: string;
  title?: string;
}

const ID_RE = /^[a-z][a-z0-9_-]{0,63}$/;

export function isSimStepType(value: unknown): value is SimStepType {
  return typeof value === 'string' && (SIM_STEP_TYPES as readonly string[]).includes(value);
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

export function parseScenario(raw: unknown, at = 'scenario'): Scenario {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${at}: expected object`);
  const s = raw as Record<string, unknown>;
  if (typeof s.version !== 'string' || !s.version.trim()) throw new Error(`${at}: version required`);
  if (typeof s.title !== 'string' || !s.title.trim()) throw new Error(`${at}: title required`);
  if (typeof s.description !== 'string') throw new Error(`${at}: description must be string`);
  if (!Array.isArray(s.steps) || s.steps.length < 1) throw new Error(`${at}: steps must be a non-empty array`);
  const steps = s.steps.map((step, i) => parseSimStep(step, `${at}.steps[${i}]`));
  const out: Scenario = {
    version: s.version.trim(),
    title: s.title.trim(),
    description: s.description,
    steps,
  };
  if (s.attribution !== undefined) {
    if (typeof s.attribution !== 'string') throw new Error(`${at}: attribution must be string`);
    out.attribution = s.attribution;
  }
  return out;
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
