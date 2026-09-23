import type {FollowLiveState, LiveEvent, PresenceSnapshot, PresenterLiveState} from './types.ts';

export type LiveRole = 'facilitator' | 'participant';

export interface LiveSnapshot {
  readonly type: 'snapshot';
  readonly presenter: PresenterLiveState;
  readonly follow: FollowLiveState | null;
  readonly presence: PresenceSnapshot;
  readonly timerRemaining: number | null;
}

export interface LiveClientOptions {
  readonly roomId: string;
  readonly participantId: string;
  readonly name: string;
  readonly role: LiveRole;
  readonly baseUrl?: string;
  /** Prefer WebSocket; fall back to SSE on failure. */
  readonly transport?: 'ws' | 'sse' | 'auto';
  readonly onEvent: (event: LiveEvent | LiveSnapshot | {type: 'ack' | 'error'; [key: string]: unknown}) => void;
  readonly onConnectionChange?: (state: 'connecting' | 'open' | 'closed' | 'reconnecting') => void;
}

const headers = (opts: LiveClientOptions): HeadersInit => ({
  'content-type': 'application/json',
  'x-participant-id': opts.participantId,
  'x-participant-name': opts.name,
  'x-role': opts.role,
});

export class LiveClient {
  private ws: WebSocket | null = null;
  private es: EventSource | null = null;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly opts: LiveClientOptions;
  private readonly base: string;

  constructor(opts: LiveClientOptions) {
    this.opts = opts;
    this.base = opts.baseUrl ?? '';
  }

  start(): void {
    this.closed = false;
    const mode = this.opts.transport ?? 'auto';
    if (mode === 'sse') this.openSse();
    else this.openWs();
  }

  stop(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.es?.close();
    this.ws = null;
    this.es = null;
  }

  /** Force-close the WebSocket (for AC reconnect tests). */
  killWebSocket(): void {
    this.ws?.close();
  }

  async command(command: string, body: Record<string, unknown> = {}): Promise<unknown> {
    // Commands always go over HTTP so every browser shares one authoritative apply path;
    // WebSocket/SSE are push-only for state fan-out (AET-26 multi-participant AC).
    const response = await fetch(`${this.base}/live/${encodeURIComponent(this.opts.roomId)}/command/${command}`, {
      method: 'POST',
      headers: headers(this.opts),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`command failed: HTTP ${response.status}`);
    return response.json();
  }

  private openWs(): void {
    this.opts.onConnectionChange?.('connecting');
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = this.base ? new URL(this.base, location.origin).host : location.host;
    const url =
      `${proto}://${host}/live/${encodeURIComponent(this.opts.roomId)}/ws` +
      `?participantId=${encodeURIComponent(this.opts.participantId)}&name=${encodeURIComponent(this.opts.name)}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => this.opts.onConnectionChange?.('open');
    ws.onmessage = (event) => {
      try {
        this.opts.onEvent(JSON.parse(String(event.data)));
      } catch {
        /* ignore malformed */
      }
    };
    ws.onclose = () => {
      this.ws = null;
      if (this.closed) {
        this.opts.onConnectionChange?.('closed');
        return;
      }
      this.opts.onConnectionChange?.('reconnecting');
      // Prefer WS reconnect; SSE fallback if WS keeps failing
      this.reconnectTimer = setTimeout(() => {
        if (this.closed) return;
        if ((this.opts.transport ?? 'auto') === 'ws') this.openWs();
        else this.openSse();
      }, 250);
    };
    ws.onerror = () => {
      // onclose follows
    };
  }

  private openSse(): void {
    this.opts.onConnectionChange?.('connecting');
    const url =
      `${this.base}/live/${encodeURIComponent(this.opts.roomId)}/sse` +
      `?participantId=${encodeURIComponent(this.opts.participantId)}&name=${encodeURIComponent(this.opts.name)}`;
    const es = new EventSource(url);
    this.es = es;
    es.onopen = () => this.opts.onConnectionChange?.('open');
    es.onmessage = (event) => {
      try {
        this.opts.onEvent(JSON.parse(event.data));
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      es.close();
      this.es = null;
      if (this.closed) return;
      this.opts.onConnectionChange?.('reconnecting');
      this.reconnectTimer = setTimeout(() => {
        if (!this.closed) this.openWs();
      }, 250);
    };
  }
}
