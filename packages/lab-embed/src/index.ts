export const LAB_EMBED_VERSION = 1;
export const MAX_LAB_MESSAGE_CHARS = 8_192;
export const MAX_LAB_EVIDENCE_CHARS = 2_000;

const LAB_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const MAX_STEPS = 1_000;

export type LabId = string & {readonly __brand: 'LabId'};
export type LabLocale = 'nl' | 'en';
export type LabConfig = Readonly<Record<string, string | number | boolean>>;
export type LabResult = {readonly outcome: 'completed'; readonly score?: {readonly value: number; readonly max: number}};
export type LabCompletion = {readonly labId: LabId; readonly result: LabResult; readonly evidence?: string};

export type HostToLabMessage = {
  readonly v: typeof LAB_EMBED_VERSION;
  readonly type: 'init';
  readonly labId: LabId;
  readonly config: LabConfig;
  readonly locale: LabLocale;
};

export type LabToHostMessage =
  | {readonly v: typeof LAB_EMBED_VERSION; readonly type: 'ready'}
  | {readonly v: typeof LAB_EMBED_VERSION; readonly type: 'progress'; readonly step: number; readonly total: number}
  | ({readonly v: typeof LAB_EMBED_VERSION; readonly type: 'complete'} & LabCompletion)
  | {readonly v: typeof LAB_EMBED_VERSION; readonly type: 'error'; readonly message: string};

/** What a day pack declares. `src` may be relative to the Academy origin. */
export type LabDeclaration = {readonly id: string; readonly src: string; readonly title: string; readonly config?: LabConfig};

/** A declaration that passed validation and the server-side origin allowlist. */
export type EmbeddableLab = {
  readonly id: LabId;
  readonly src: string;
  readonly origin: string;
  readonly title: string;
  readonly config: LabConfig;
};

type Fields = Record<string, unknown>;

function record(value: unknown): Fields | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Fields) : null;
}

function withinSize(value: unknown): boolean {
  try {
    const json = JSON.stringify(value);
    return typeof json === 'string' && json.length <= MAX_LAB_MESSAGE_CHARS;
  } catch {
    return false;
  }
}

function versioned(data: unknown): Fields | null {
  const fields = record(data);
  if (!fields || fields.v !== LAB_EMBED_VERSION || typeof fields.type !== 'string' || !withinSize(fields)) return null;
  return fields;
}

const step = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_STEPS;

export function parseLabId(value: unknown): LabId | null {
  return typeof value === 'string' && LAB_ID_PATTERN.test(value) ? (value as LabId) : null;
}

function parseConfig(value: unknown): LabConfig | null {
  if (value === undefined) return {};
  const fields = record(value);
  if (!fields) return null;
  const entries = Object.entries(fields);
  if (entries.length > 32) return null;
  for (const [key, entry] of entries) {
    if (key.length > 64 || !['string', 'number', 'boolean'].includes(typeof entry)) return null;
    if (typeof entry === 'string' && entry.length > 512) return null;
  }
  return fields as LabConfig;
}

function parseResult(value: unknown): LabResult | null {
  const fields = record(value);
  if (!fields || fields.outcome !== 'completed') return null;
  if (fields.score === undefined) return {outcome: 'completed'};
  const score = record(fields.score);
  if (!score || !step(score.value) || !step(score.max) || score.value > score.max) return null;
  return {outcome: 'completed', score: {value: score.value, max: score.max}};
}

/** Shared by the `complete` message and the server endpoint body. */
export function parseLabCompletion(value: unknown): LabCompletion | null {
  const fields = record(value);
  if (!fields || !withinSize(fields)) return null;
  const labId = parseLabId(fields.labId);
  const result = parseResult(fields.result);
  if (!labId || !result) return null;
  if (fields.evidence === undefined) return {labId, result};
  if (typeof fields.evidence !== 'string' || fields.evidence.length > MAX_LAB_EVIDENCE_CHARS) return null;
  return {labId, result, evidence: fields.evidence};
}

export function parseHostMessage(data: unknown): HostToLabMessage | null {
  const fields = versioned(data);
  if (!fields || fields.type !== 'init') return null;
  const labId = parseLabId(fields.labId);
  const config = parseConfig(fields.config);
  if (!labId || !config || (fields.locale !== 'nl' && fields.locale !== 'en')) return null;
  return {v: LAB_EMBED_VERSION, type: 'init', labId, config, locale: fields.locale};
}

export function parseLabMessage(data: unknown): LabToHostMessage | null {
  const fields = versioned(data);
  if (!fields) return null;
  switch (fields.type) {
    case 'ready':
      return {v: LAB_EMBED_VERSION, type: 'ready'};
    case 'progress':
      if (!step(fields.step) || !step(fields.total) || fields.total < 1 || fields.step > fields.total) return null;
      return {v: LAB_EMBED_VERSION, type: 'progress', step: fields.step, total: fields.total};
    case 'complete': {
      const completion = parseLabCompletion(fields);
      return completion && {v: LAB_EMBED_VERSION, type: 'complete', ...completion};
    }
    case 'error':
      if (typeof fields.message !== 'string' || fields.message.length > 500) return null;
      return {v: LAB_EMBED_VERSION, type: 'error', message: fields.message};
    default:
      return null;
  }
}

/** Parses a comma-separated origin list. Wildcards, paths and non-HTTP(S) entries are dropped. */
export function parseOriginAllowlist(raw: string | undefined, ...always: string[]): string[] {
  const origins = new Set<string>();
  for (const entry of [...always, ...(raw ?? '').split(',')].map(value => value.trim()).filter(Boolean)) {
    try {
      const url = new URL(entry);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && url.origin === entry.replace(/\/$/, '')) origins.add(url.origin);
    } catch {
      continue;
    }
  }
  return [...origins];
}

/** Keeps only declarations with a valid id, an HTTP(S) src and an allowlisted origin. */
export function resolveLabs(
  declarations: readonly LabDeclaration[] | undefined,
  {baseUrl, allowedOrigins}: {readonly baseUrl: string; readonly allowedOrigins: readonly string[]},
): EmbeddableLab[] {
  const seen = new Set<string>();
  const labs: EmbeddableLab[] = [];
  for (const declaration of declarations ?? []) {
    const id = parseLabId(declaration.id);
    const config = parseConfig(declaration.config);
    if (!id || !config || seen.has(id) || typeof declaration.title !== 'string' || !declaration.title.trim()) continue;
    let url: URL;
    try {
      url = new URL(declaration.src, baseUrl);
    } catch {
      continue;
    }
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || !allowedOrigins.includes(url.origin)) continue;
    seen.add(id);
    labs.push({id, src: url.href, origin: url.origin, title: declaration.title.trim(), config});
  }
  return labs;
}

export type LabMessageEvent = {readonly data: unknown; readonly origin: string; readonly source: unknown};
export type PostTarget = {postMessage(message: unknown, targetOrigin: string): void};
export type MessageHub = {
  addEventListener(type: 'message', listener: (event: LabMessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: LabMessageEvent) => void): void;
};

export type HostBridge = {readonly sendInit: () => void; readonly dispose: () => void};

/**
 * Host side. Accepts a message only when it comes from the embedded frame's window
 * and the lab's allowlisted origin, parses, and drops `complete` for any other lab id.
 */
export function connectHost(
  hub: MessageHub,
  frame: {readonly contentWindow: PostTarget | null},
  lab: EmbeddableLab,
  {locale, onMessage}: {readonly locale: LabLocale; readonly onMessage: (message: LabToHostMessage) => void},
): HostBridge {
  const init: HostToLabMessage = {v: LAB_EMBED_VERSION, type: 'init', labId: lab.id, config: lab.config, locale};
  const sendInit = () => frame.contentWindow?.postMessage(init, lab.origin);
  const listener = (event: LabMessageEvent) => {
    if (event.origin !== lab.origin || !frame.contentWindow || event.source !== frame.contentWindow) return;
    const message = parseLabMessage(event.data);
    if (!message) return;
    if (message.type === 'complete' && message.labId !== lab.id) return;
    if (message.type === 'ready') sendInit();
    onMessage(message);
  };
  hub.addEventListener('message', listener);
  return {sendInit, dispose: () => hub.removeEventListener('message', listener)};
}

export type LabBridge = {
  readonly progress: (step: number, total: number) => boolean;
  readonly complete: (result: LabResult, evidence?: string) => boolean;
  readonly error: (message: string) => boolean;
  readonly dispose: () => void;
};

/**
 * Lab side. Announces `ready` to each allowlisted host origin (the browser drops
 * deliveries to any origin the parent does not have), binds to the first valid
 * `init` from the parent window, and only then emits progress and completion.
 */
export function connectLab(
  hub: MessageHub,
  parent: PostTarget,
  {allowedHostOrigins, onInit}: {readonly allowedHostOrigins: readonly string[]; readonly onInit: (message: HostToLabMessage) => void},
): LabBridge {
  let bound: {readonly origin: string; readonly labId: LabId} | null = null;
  const send = (message: LabToHostMessage) => {
    if (!bound) return false;
    parent.postMessage(message, bound.origin);
    return true;
  };
  const listener = (event: LabMessageEvent) => {
    if (event.source !== parent || !allowedHostOrigins.includes(event.origin)) return;
    const message = parseHostMessage(event.data);
    if (!message || (bound && (bound.origin !== event.origin || bound.labId !== message.labId))) return;
    bound = {origin: event.origin, labId: message.labId};
    onInit(message);
  };
  hub.addEventListener('message', listener);
  for (const origin of allowedHostOrigins) parent.postMessage({v: LAB_EMBED_VERSION, type: 'ready'}, origin);
  return {
    progress: (step, total) => send({v: LAB_EMBED_VERSION, type: 'progress', step, total}),
    complete: (result, evidence) =>
      !!bound && send({v: LAB_EMBED_VERSION, type: 'complete', labId: bound.labId, result, ...(evidence === undefined ? {} : {evidence})}),
    error: message => send({v: LAB_EMBED_VERSION, type: 'error', message}),
    dispose: () => hub.removeEventListener('message', listener),
  };
}
