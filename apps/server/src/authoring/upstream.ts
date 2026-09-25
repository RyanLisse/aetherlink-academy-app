import {createHash} from 'node:crypto';
import type {AuthoringUpstreamConfig} from './config.ts';
import {UpstreamContractError, UpstreamNotFound, UpstreamUnavailable, UpstreamUncertain} from './errors.ts';

export interface UpstreamSlideInput {
  readonly id: string;
  readonly content: string;
  readonly notes?: string;
  readonly layout?: string;
}

export interface UpstreamSlide {
  readonly id: string;
  readonly content: string;
  readonly notes: string | null;
}

export interface UpstreamDeck {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly slideCount: number;
  readonly slides: ReadonlyArray<UpstreamSlide>;
  readonly revision: string;
}

const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_REQUEST_BYTES = 1_000_000;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const revisionOf = (data: unknown): string => createHash('sha256').update(JSON.stringify(canonicalize(data))).digest('hex');

const statusMessage = (action: string, status: number): string =>
  `Upstream ${action} failed with status ${status}.`;

const readBoundedResponseText = async (response: Response): Promise<string> => {
  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
      throw new UpstreamContractError({message: 'Upstream response body is too large.'});
    }
    return text;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new UpstreamContractError({message: 'Upstream response body is too large.'});
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
};

const isPlainSlide = (value: unknown, requireContent = true): value is {id: string; content?: unknown; notes?: unknown} =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as {id?: unknown}).id === 'string' &&
  (!requireContent || typeof (value as {content?: unknown}).content === 'string');

export class SlidesUpstream {
  constructor(
    private readonly config: AuthoringUpstreamConfig,
    private readonly timeoutMs: number,
  ) {}

  async createDeck(input: {title: string; slides: ReadonlyArray<UpstreamSlideInput>}): Promise<UpstreamDeck> {
    const {status, body} = await this.request('/_agent-native/actions/create-deck', {
      method: 'POST',
      body: JSON.stringify({title: input.title, slides: input.slides}),
    });
    if (status < 200 || status >= 300) {
      throw new UpstreamContractError({message: statusMessage('create-deck', status)});
    }
    const created = this.parseDeck(body, 'create-deck', true);
    // The create action may return the compact MCP representation, whose
    // slides contain previews but no HTML. Read back the canonical persisted
    // revision before handing it to the authoring store.
    try {
      return await this.getDeck(created.id, {compact: false});
    } catch (error) {
      if (error instanceof UpstreamUncertain) throw error;
      throw new UpstreamUncertain({
        message: 'Slides deck creation succeeded but canonical readback was inconclusive. Check the deck manually before retrying.',
      });
    }
  }

  async getDeck(id: string, options?: {readonly compact?: boolean}): Promise<UpstreamDeck> {
    const query = new URLSearchParams({id, compact: options?.compact ? 'true' : 'false'});
    const {status, body} = await this.request(`/_agent-native/actions/get-deck?${query.toString()}`, {method: 'GET'});
    if (status === 404) throw new UpstreamNotFound({message: `Upstream deck ${id} was not found.`});
    if (status < 200 || status >= 300) {
      throw new UpstreamContractError({message: statusMessage('get-deck', status)});
    }
    return this.parseDeck(body, 'get-deck');
  }

  private async request(pathAndQuery: string, init: {readonly method: string; readonly body?: string}): Promise<{status: number; body: unknown}> {
    if (init.body !== undefined && Buffer.byteLength(init.body, 'utf8') > MAX_REQUEST_BYTES) {
      throw new UpstreamContractError({message: 'Upstream request body is too large.'});
    }
    let response: Response;
    try {
      response = await fetch(`${this.config.origin}${pathAndQuery}`, {
        method: init.method,
        ...(init.body !== undefined ? {body: init.body} : {}),
        headers: {
          authorization: `Bearer ${this.config.token}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new UpstreamUncertain({
          message: 'Upstream Slides request timed out; whether it was applied upstream is unknown. Check the deck manually before retrying.',
        });
      }
      throw new UpstreamUnavailable({message: 'Upstream Slides service is unreachable.'});
    }
    if (response.status >= 300 && response.status < 400) {
      throw new UpstreamContractError({message: `Upstream returned a redirect (status ${response.status}); redirects are not followed.`});
    }
    const text = await readBoundedResponseText(response);
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new UpstreamContractError({message: `Upstream returned a non-JSON response (status ${response.status}).`});
      }
    }
    return {status: response.status, body};
  }

  private parseDeck(body: unknown, action: 'create-deck' | 'get-deck', allowCompactSlides = false): UpstreamDeck {
    if (!body || typeof body !== 'object') {
      throw new UpstreamContractError({message: `Upstream ${action} returned an unexpected response shape.`});
    }
    const record = body as Record<string, unknown>;
    const id = record.id;
    const title = record.title;
    const url = record.url ?? record.appUrl;
    const slides = record.slides;
    if (typeof id !== 'string' || !id) throw new UpstreamContractError({message: `Upstream ${action} response is missing a deck id.`});
    if (!allowCompactSlides && typeof title !== 'string') throw new UpstreamContractError({message: `Upstream ${action} response is missing a title.`});
    if (!allowCompactSlides && (typeof url !== 'string' || !url)) throw new UpstreamContractError({message: `Upstream ${action} response is missing an editor URL.`});
    if (!allowCompactSlides && !Array.isArray(slides)) {
      throw new UpstreamContractError({message: `Upstream ${action} response has malformed slides.`});
    }
    if (slides !== undefined && (!Array.isArray(slides) || !slides.every((slide) => isPlainSlide(slide, !allowCompactSlides)))) {
      throw new UpstreamContractError({message: `Upstream ${action} response has malformed slides.`});
    }
    if (typeof url === 'string' && url) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new UpstreamContractError({message: `Upstream ${action} returned an unparseable editor URL.`});
      }
      if (parsedUrl.origin !== this.config.origin) {
        throw new UpstreamContractError({message: `Upstream ${action} returned an editor URL outside the configured upstream origin.`});
      }
    }
    const slideEntries = Array.isArray(slides) ? slides : [];
    const normalizedSlides: ReadonlyArray<UpstreamSlide> = slideEntries.map((slide) => ({
      id: slide.id,
      content: typeof slide.content === 'string' ? slide.content : '',
      notes: typeof slide.notes === 'string' ? slide.notes : null,
    }));
    const resolvedTitle = typeof title === 'string' ? title : '';
    const resolvedUrl = typeof url === 'string' ? url : `${this.config.origin}/_agent-native/decks/${encodeURIComponent(id)}`;
    const slideCount = typeof record.slideCount === 'number' ? record.slideCount : normalizedSlides.length;
    const revision = typeof record.revision === 'string' && record.revision ? record.revision : revisionOf({id, title: resolvedTitle, slides: normalizedSlides});
    return {id, title: resolvedTitle, url: resolvedUrl, slideCount, slides: normalizedSlides, revision};
  }
}
