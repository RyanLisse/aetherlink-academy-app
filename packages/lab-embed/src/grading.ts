import {MAX_GRADED_STOPS, parseLabId, parseStopId, type LabAnswer, type LabId, type StopId} from './index.ts';

/**
 * Server-only answer keys for graded stops. Kinds mirror what Arcade Lab checkpoints
 * check today: `choice` is a knowledge check (`options` + `correct`), `match` is the
 * `assert` shape (`includes` / `regex`) applied to submitted text. Grading never runs
 * submitted code.
 */
export type GradeKey =
  | {readonly kind: 'choice'; readonly correct: number}
  | {readonly kind: 'match'; readonly includes?: string; readonly regex?: RegExp};

export type LabKeys = ReadonlyMap<LabId, ReadonlyMap<StopId, GradeKey>>;

export type StopRecord = {
  readonly stopId: StopId;
  readonly passed: boolean;
  readonly attempts: number;
  readonly at: string;
  readonly source: 'server-graded';
};

type Fields = Record<string, unknown>;
const isRecord = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);

function parseKey(raw: unknown, where: string): GradeKey {
  if (!isRecord(raw)) throw new Error(`${where}: expected an object`);
  switch (raw.kind) {
    case 'choice':
      if (!Number.isInteger(raw.correct) || (raw.correct as number) < 0) throw new Error(`${where}: choice needs a non-negative integer correct`);
      return {kind: 'choice', correct: raw.correct as number};
    case 'match': {
      const {includes, regex, flags = ''} = raw;
      if (includes !== undefined && (typeof includes !== 'string' || !includes)) throw new Error(`${where}: includes must be a non-empty string`);
      if (regex !== undefined && (typeof regex !== 'string' || !regex)) throw new Error(`${where}: regex must be a non-empty string`);
      if (includes === undefined && regex === undefined) throw new Error(`${where}: match needs includes or regex`);
      if (typeof flags !== 'string' || !/^[imsu]*$/.test(flags)) throw new Error(`${where}: flags may only use i, m, s, u`);
      return {kind: 'match', ...(includes === undefined ? {} : {includes}), ...(regex === undefined ? {} : {regex: new RegExp(regex, flags)})};
    }
    default:
      throw new Error(`${where}: unknown kind ${String(raw.kind)}`);
  }
}

/** Parses `{[labId]: {[stopId]: key}}` at startup. A malformed key throws so the server refuses to boot. */
export function parseLabKeys(raw: unknown): LabKeys {
  if (!isRecord(raw)) throw new Error('lab keys: expected an object');
  const labs = new Map<LabId, ReadonlyMap<StopId, GradeKey>>();
  for (const [rawLabId, rawStops] of Object.entries(raw)) {
    const labId = parseLabId(rawLabId);
    if (!labId || !isRecord(rawStops)) throw new Error(`lab keys: invalid lab ${rawLabId}`);
    if (Object.keys(rawStops).length > MAX_GRADED_STOPS) throw new Error(`lab keys: ${labId} has more than ${MAX_GRADED_STOPS} graded stops`);
    const stops = new Map<StopId, GradeKey>();
    for (const [rawStopId, rawKey] of Object.entries(rawStops)) {
      const stopId = parseStopId(rawStopId);
      if (!stopId) throw new Error(`lab keys: invalid stop ${labId}/${rawStopId}`);
      stops.set(stopId, parseKey(rawKey, `lab keys ${labId}/${stopId}`));
    }
    labs.set(labId, stops);
  }
  return labs;
}

const GRADERS: {readonly [K in GradeKey['kind']]: (key: Extract<GradeKey, {kind: K}>, answer: LabAnswer) => boolean} = {
  choice: (key, answer) => answer === key.correct,
  match: (key, answer) =>
    typeof answer === 'string' && (key.includes === undefined || answer.includes(key.includes)) && (key.regex === undefined || key.regex.test(answer)),
};

export function gradeAnswer(key: GradeKey, answer: LabAnswer): boolean {
  return (GRADERS[key.kind] as (key: GradeKey, answer: LabAnswer) => boolean)(key, answer);
}

/** A passed stop stays passed: later answers neither re-grade it nor count as attempts. */
export function recordAttempt(
  existing: StopRecord | undefined,
  key: GradeKey,
  {stopId, answer}: {readonly stopId: StopId; readonly answer: LabAnswer},
  at: string,
): {readonly recorded: boolean; readonly stop: StopRecord} {
  if (existing?.passed) return {recorded: false, stop: existing};
  return {recorded: true, stop: {stopId, passed: gradeAnswer(key, answer), attempts: (existing?.attempts ?? 0) + 1, at, source: 'server-graded'}};
}

export function gradedStopsPassed(
  keys: ReadonlyMap<StopId, GradeKey> | undefined,
  records: Readonly<Record<string, StopRecord>> | undefined,
): {readonly passed: number; readonly total: number} {
  const ids = [...(keys?.keys() ?? [])];
  return {passed: ids.filter(id => records?.[id]?.passed === true).length, total: ids.length};
}
